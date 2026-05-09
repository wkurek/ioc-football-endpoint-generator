import { NavLink } from 'react-router-dom';

interface NavTabProps {
  to: string;
  label: string;
}

export function NavTab({ to, label }: NavTabProps) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        [
          'rounded-md px-3 py-1.5 text-sm transition-colors',
          isActive
            ? 'bg-slate-100 font-medium text-slate-900 dark:bg-slate-800 dark:text-slate-100'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100',
        ].join(' ')
      }
    >
      {label}
    </NavLink>
  );
}
