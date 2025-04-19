// ChatBotScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { GiftedChat, Bubble, Send } from 'react-native-gifted-chat';
import Icon from 'react-native-vector-icons/Ionicons';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import CustomHeader from './CustomHeader';

const BACKEND_URL = 'http://192.168.1.2:3000/chatbot';
const WEEKDAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS   = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const formatWordDate = iso => {
  const [y,m,d] = iso.split('-').map(Number);
  const date = new Date(y, m-1, d);
  const wd   = WEEKDAYS[date.getDay()];
  const wk   = [0,6].includes(date.getDay()) ? 'Weekend' : 'Weekday';
  return `${MONTHS[m-1]} ${d}, ${y} (${wd}, ${wk})`;
};

const normalize = s =>
  String(s||'').replace(/^dr\.?\s*/i,'').replace(/[^a-z0-9]/gi,'').toLowerCase();

const getConsultantByName = async rawName => {
  const target = normalize(rawName);
  const snap = await getDocs(collection(db,'consultants'));
  for (const d of snap.docs)
    if (normalize(d.data().name) === target)
      return { id: d.id, ...d.data() };
  for (const d of snap.docs){
    const cand = normalize(d.data().name);
    if (cand.includes(target)||target.includes(cand))
      return { id: d.id, ...d.data() };
  }
  return null;
};

const getConsultantById = async id => {
  const snap = await getDoc(doc(db,'consultants',id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

const upcomingDates = (wdList, span=30) => {
  const out = [], today = new Date();
  for(let i=0;i<span;i++){
    const d = new Date();
    d.setDate(today.getDate()+i);
    if (wdList.map(w=>w.toLowerCase()).includes(WEEKDAYS[d.getDay()].toLowerCase())){
      out.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);
    }
  }
  return out;
};

const parseDateTime = text => {
  const t = String(text||'').trim(), lower = t.toLowerCase();
  if (/\btoday\b/.test(lower)){
    const d=new Date();
    return { date:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,time:null };
  }
  if (/\btomorrow\b/.test(lower)||/\bnext day\b/.test(lower)){
    const d=new Date(); d.setDate(d.getDate()+1);
    return { date:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,time:null };
  }
  const thisWd = lower.match(/\bthis\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i);
  if (thisWd){
    const wg = thisWd[1][0].toUpperCase()+thisWd[1].slice(1).toLowerCase();
    const idx=WEEKDAYS.indexOf(wg), d=new Date();
    let delta=(idx-d.getDay()+7)%7; d.setDate(d.getDate()+delta);
    return { date:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,time:null };
  }
  const nextWd = lower.match(/\bnext\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i);
  if (nextWd){
    const wg = nextWd[1][0].toUpperCase()+nextWd[1].slice(1).toLowerCase();
    const idx=WEEKDAYS.indexOf(wg), d=new Date();
    let delta=(idx-d.getDay()+7)%7; if(delta===0) delta=7;
    d.setDate(d.getDate()+delta);
    return { date:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,time:null };
  }
  const explicit=lower.match(/(\d{4}-\d{2}-\d{2})/);
  const date=explicit?explicit[1]:null;
  const tm=t.match(/(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)/i);
  return { date, time: tm?tm[1]:null };
};

const parseUserTime = input => {
  const m = String(input||'').trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if(!m) return null;
  let h=parseInt(m[1],10), mm=m[2]?parseInt(m[2],10):0;
  const suf = m[3]?m[3].toUpperCase():(h>=12?'PM':'AM');
  if(suf==='PM'&&h<12) h+=12;
  if(suf==='AM'&&h===12) h=0;
  const dispH=h%12===0?12:h%12;
  const dispM=String(mm).padStart(2,'0');
  return `${dispH}:${dispM} ${suf}`;
};

export default function ChatBotScreen({ navigation }){
  const [messages,setMessages]=useState([]);
  const [loading,setLoading]=useState(false);
  const [stage,setStage]=useState('');
  const [doctor,setDoctor]=useState(null);
  const [availableDates,setAvailableDates]=useState([]);
  const [chosenDate,setChosenDate]=useState(null);
  const [chosenTime,setChosenTime]=useState(null);
  const [chosenPlatform,setChosenPlatform]=useState(null);

  useEffect(()=>{
    setMessages([{
      _id:1,
      text:'Hello! Tell me your symptoms, and I’ll recommend a doctor.',
      createdAt:new Date(),
      user:{_id:2,name:'HealthBot'},
    }]);
  },[]);

  const resetConversation=()=>{
    setStage(''); setDoctor(null);
    setAvailableDates([]); setChosenDate(null);
    setChosenTime(null); setChosenPlatform(null);
  };

  const onSend=useCallback(async newMsgs=>{
    const userText=newMsgs[0].text.trim();
    if(!userText) return;
    setMessages(prev=>GiftedChat.append(prev,newMsgs));
    setLoading(true);
    try{
      // 0) recommend
      if(stage===''){
        const resp=await fetch(BACKEND_URL,{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({symptoms:userText}),
        });
        const data=await resp.json();
        if(!resp.ok||data.error) throw new Error(data.error||'Service error.');
        let recDoc,recName;
        if(data.doctorId){
          recDoc=await getConsultantById(data.doctorId);
          recName=data.doctorName;
        } else {
          const m=data.recommendation?.match(/Dr\.\s*([\w\s]+)/i);
          recName=m?`Dr. ${m[1].trim()}`:data.recommendation;
          recDoc=await getConsultantByName(recName);
        }
        if(!recDoc) throw new Error('No matching doctor found.');
        const datesList=upcomingDates(recDoc.availableDays||[],14);
        setDoctor(recDoc); setAvailableDates(datesList);

        const preview=datesList.slice(0,5).map(d=>`• ${formatWordDate(d)}`).join('\n');
        setMessages(prev=>GiftedChat.append(prev,[{
          _id:Math.random(),
          text:
`I recommend **${recDoc.name}**.
Next available dates:
${preview}

Shall we book an appointment? (Yes/No)`,
          createdAt:new Date(),
          user:{_id:2,name:'HealthBot'},
        }]));
        setStage('confirmBooking');
      }
      // 1) confirm
      else if(stage==='confirmBooking'){
        if(/^y(es)?$/i.test(userText)){
          setMessages(prev=>GiftedChat.append(prev,[{
            _id:Math.random(),
            text:
`Great! Choose a date:
${availableDates.map(d=>formatWordDate(d)).join('\n')}`,
            createdAt:new Date(),
            user:{_id:2,name:'HealthBot'},
          }]));
          setStage('selectDate');
        } else {
          setMessages(prev=>GiftedChat.append(prev,[{
            _id:Math.random(),
            text:'No worries—let me know if you need anything else.',
            createdAt:new Date(),
            user:{_id:2,name:'HealthBot'},
          }]));
          resetConversation();
        }
      }
      // 2) date
      else if(stage==='selectDate'){
        const {date}=parseDateTime(userText);
        if(!date||!availableDates.includes(date)){
          setMessages(prev=>GiftedChat.append(prev,[{
            _id:Math.random(),
            text:
`Sorry, ${formatWordDate(date||'0001-01-01')} isn’t available.
Please pick from:
${availableDates.map(d=>formatWordDate(d)).join('\n')}`,
            createdAt:new Date(),
            user:{_id:2,name:'HealthBot'},
          }]));
          return;
        }
        setChosenDate(date);
        setMessages(prev=>GiftedChat.append(prev,[{
          _id:Math.random(),
          text:
`What time on ${formatWordDate(date)}?
Options: ${doctor.consultationHours.join(', ')}`,
          createdAt:new Date(),
          user:{_id:2,name:'HealthBot'},
        }]));
        setStage('selectTime');
      }
      // 3) time
      else if(stage==='selectTime'){
        const userTime=parseUserTime(userText);
        if(!userTime){
          setMessages(prev=>GiftedChat.append(prev,[{
            _id:Math.random(),
            text:'Please enter a time like “8 PM” or “14:30”.',
            createdAt:new Date(),
            user:{_id:2,name:'HealthBot'},
          }]));
          return;
        }
        const matchSlot=doctor.consultationHours.find(slot=>{
          const start=slot.split('to')[0].trim();
          return parseUserTime(start)===userTime;
        });
        if(!matchSlot){
          setMessages(prev=>GiftedChat.append(prev,[{
            _id:Math.random(),
            text:`Sorry, ${userTime} isn’t available. Available times: ${doctor.consultationHours.join(', ')}`,
            createdAt:new Date(),
            user:{_id:2,name:'HealthBot'},
          }]));
          return;
        }
        // <-- PASS FULL SLOT as chosenTime
        setChosenTime(matchSlot);
        setMessages(prev=>GiftedChat.append(prev,[{
          _id:Math.random(),
          text:'Online or In Person?',
          createdAt:new Date(),
          user:{_id:2,name:'HealthBot'},
        }]));
        setStage('selectPlatform');
      }
      // 4) platform
      else if(stage==='selectPlatform'){
        const lower=userText.toLowerCase();
        if(lower.includes('online')) setChosenPlatform('Online');
        else if(lower.includes('in person')||lower.includes('person')) setChosenPlatform('In Person');
        else{
          setMessages(prev=>GiftedChat.append(prev,[{
            _id:Math.random(),
            text:'Please reply “Online” or “In Person.”',
            createdAt:new Date(),
            user:{_id:2,name:'HealthBot'},
          }]));
          return;
        }
        setMessages(prev=>GiftedChat.append(prev,[{
          _id:Math.random(),
          text:
`Confirm appointment:
${formatWordDate(chosenDate)}
Time: ${chosenTime}
Mode: ${chosenPlatform}
(Yes/No)`,
          createdAt:new Date(),
          user:{_id:2,name:'HealthBot'},
          type:'confirm',
        }]));
        setStage('confirmDetails');
      }
      // 5) confirm
      else if(stage==='confirmDetails'){
        if(/^y(es)?$/i.test(userText)){
          navigation.navigate('AppointmentScreen',{
            doctor,
            date:chosenDate,
            time:chosenTime,       // full slot string
            platform:chosenPlatform,
          });
          resetConversation();
        } else {
          setMessages(prev=>GiftedChat.append(prev,[{
            _id:Math.random(),
            text:'Appointment cancelled.',
            createdAt:new Date(),
            user:{_id:2,name:'HealthBot'},
          }]));
          resetConversation();
        }
      }
    }catch(err){
      setMessages(prev=>GiftedChat.append(prev,[{
        _id:Math.random(),
        text:`Error: ${err.message}`,
        createdAt:new Date(),
        user:{_id:2,name:'HealthBot'},
      }]));
      resetConversation();
    }finally{
      setLoading(false);
    }
  },[stage,availableDates,doctor,chosenDate,chosenTime,chosenPlatform]);

  return (
    <View style={styles.container}>
      <CustomHeader title="Chat with HealthBot" onBack={()=>navigation.goBack()} />
      <GiftedChat
        messages={messages}
        onSend={onSend}
        user={{_id:1}}
        renderBubble={props=>(
          <Bubble
            {...props}
            wrapperStyle={{ right:{backgroundColor:'#007AFF'}, left:{backgroundColor:'#ECECEC'} }}
            textStyle={{ right:{color:'#fff'}, left:{color:'#000'} }}
          />
        )}
        renderSend={props=>(
          <Send {...props}>
            <Icon name="send" size={24} style={{margin:8}}/>
          </Send>
        )}
        renderFooter={()=> loading ? <ActivityIndicator style={styles.spinner} size="small"/> : null}
        renderCustomView={props=> props.currentMessage.type==='confirm' && (
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={()=>{
              navigation.navigate('AppointmentScreen',{
                doctor,
                date:chosenDate,
                time:chosenTime,
                platform:chosenPlatform,
              });
              resetConversation();
            }}
          >
            <Text style={styles.confirmText}>{props.currentMessage.text}</Text>
          </TouchableOpacity>
        )}
        scrollToBottom
      />
    </View>
  );
}

const styles=StyleSheet.create({
  container:{flex:1,backgroundColor:'#f8f8f8'},
  spinner:{marginVertical:10},
  confirmBtn:{backgroundColor:'#28A745',padding:10,borderRadius:6,alignSelf:'flex-start',marginVertical:6},
  confirmText:{color:'#fff',fontWeight:'600'},
});
