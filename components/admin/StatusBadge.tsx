type BadgeVariant = 'green' | 'yellow' | 'orange' | 'blue' | 'red';

interface StatusBadgeProps {
  label: string;
  variant: BadgeVariant;
  icon?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  green:  'bg-green-100 text-green-800 border border-green-200',
  yellow: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  orange: 'bg-orange-100 text-orange-800 border border-orange-200',
  blue:   'bg-blue-100 text-blue-800 border border-blue-200',
  red:    'bg-red-100 text-red-800 border border-red-200',
};

export const StatusBadge = ({ label, variant, icon }: StatusBadgeProps) => (
  <span className={`
    inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full 
    text-xs font-medium ${variantStyles[variant]}
  `}>
    {icon && <span>{icon}</span>}
    {label}
  </span>
);
