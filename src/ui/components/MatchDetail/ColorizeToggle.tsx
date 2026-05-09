import * as Switch from '@radix-ui/react-switch';
import { useTranslation } from 'react-i18next';

interface ColorizeToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function ColorizeToggle({ checked, onChange }: ColorizeToggleProps) {
  const { t } = useTranslation();
  const id = 'colorize-source-toggle';

  return (
    <div className="flex items-center gap-2">
      <Switch.Root
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        className="peer relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-slate-200 transition-colors data-[state=checked]:bg-blue-600 dark:bg-slate-700"
      >
        <Switch.Thumb className="pointer-events-none inline-block h-4 w-4 translate-x-0 rounded-full bg-white shadow ring-0 transition-transform data-[state=checked]:translate-x-4" />
      </Switch.Root>
      <label htmlFor={id} className="cursor-pointer text-sm text-slate-700 dark:text-slate-300">
        {t('actions.colorizeSource')}
      </label>
    </div>
  );
}
