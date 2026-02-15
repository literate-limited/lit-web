import { cn } from '../../utils/cn';
import styles from './Card.module.css';

export default function Card({ className, ...props }) {
  return <div className={cn(styles.card, className)} {...props} />;
}

