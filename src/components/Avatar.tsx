import { useEffect, useState } from 'react';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'normal' | 'large' | 'xl';
  className?: string;
}

export function Avatar({ name, src, size = 'normal', className = '' }: AvatarProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const classes = ['avatar', size !== 'normal' ? size : '', className].filter(Boolean).join(' ');
  if (src && !failed) {
    return <img className={`${classes} avatar-image`} src={src} alt={name} onError={() => setFailed(true)} />;
  }
  return <div className={classes}>{initialsFor(name)}</div>;
}

function initialsFor(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'WA';
}
