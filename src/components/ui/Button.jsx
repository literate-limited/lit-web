import { cn } from '../../utils/cn';
import styles from './Button.module.css';

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}) {
  return (
    <button
      className={cn(styles.button, styles[variant], styles[size], className)}
      {...props}
    />
  );
}

