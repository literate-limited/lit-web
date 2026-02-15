import { cn } from '../../utils/cn';
import styles from './Textarea.module.css';

export default function Textarea({ className, ...props }) {
  return <textarea className={cn(styles.textarea, className)} {...props} />;
}

