import { TouchableOpacity, Text } from 'react-native';
import theme from '../src/theme';

export default function CustomButton({ title, onPress }) {
  return (
    <TouchableOpacity 
      style={{
        backgroundColor: theme.colors.primary,
        padding: theme.spacing.md,
        borderRadius: 8,
      }}
      onPress={onPress}
    >
      <Text style={{ color: 'white', fontSize: theme.text.body }}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}
