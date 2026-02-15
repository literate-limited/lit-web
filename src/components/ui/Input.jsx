import { cn } from '../../utils/cn';
import styles from './Input.module.css';

export default function Input({ className, ...props }) {
  return <input className={cn(styles.input, className)} {...props} />;
}

