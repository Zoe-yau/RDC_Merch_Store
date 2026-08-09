import React, { useState } from 'react';
import { Header } from '../components/Header';
import { useShop } from '../context/ShopContext';

type IconProps = { className?: string };

const iconBase = 'w-5 h-5';

const CalendarIcon: React.FC<IconProps> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="4" width="18" height="17" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

const CreditCardIcon: React.FC<IconProps> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20" />
  </svg>
);

const TruckIcon: React.FC<IconProps> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M1 6h14v11H1z" />
    <path d="M15 10h4l3 3v4h-7z" />
    <circle cx="6.5" cy="19.5" r="1.5" />
    <circle cx="18" cy="19.5" r="1.5" />
  </svg>
);

const TargetIcon: React.FC<IconProps> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
  </svg>
);

const UserIcon: React.FC<IconProps> = ({ className = iconBase }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
);

const PhoneIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const MailIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m2 7 8.97 5.7a1.94 1.94 0 0 0 2.06 0L22 7" />
  </svg>
);

const CopyIcon: React.FC<IconProps> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const CheckIcon: React.FC<IconProps> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const Card: React.FC<{ icon: React.ReactNode; label: string; children: React.ReactNode; accent?: boolean }> = ({
  icon,
  label,
  children,
  accent,
}) => (
  <div
    className={`rounded-xl border p-5 shadow-sm ${
      accent ? 'border-rho-rose/40 bg-rho-rose/10' : 'border-bm-border bg-bm-card'
    }`}
  >
    <div className={`flex items-center gap-2 mb-2 ${accent ? 'text-rho-rose' : 'text-rho-teal'}`}>
      {icon}
      <p className="text-xs font-semibold uppercase tracking-widest">{label}</p>
    </div>
    {children}
  </div>
);

// Placeholder deadline values (e.g. an un-filled-in "[DATE]") shouldn't leak to buyers.
const isPlaceholder = (value: string) => {
  const v = value.trim();
  return !v || /^\[.*\]$/.test(v) || /^(tbd|tba|n\/a)$/i.test(v);
};

const formatPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
};

export const InfoPage: React.FC = () => {
  const { siteSettings } = useShop();
  const {
    infoTitle, infoDeadline, infoVenmo, infoShipping, infoGoal,
    infoChairName, infoChairPhone, infoChairEmail, infoChairEmail2,
  } = siteSettings;

  const [copied, setCopied] = useState(false);

  const hasContact = infoChairName || infoChairPhone || infoChairEmail;
  const venmoHandle = infoVenmo.trim().replace(/^@/, '');
  const venmoIsHandle = /^[\w.-]+$/.test(venmoHandle);
  const venmoLink = `https://venmo.com/u/${venmoHandle}`;

  const handleCopyVenmo = async () => {
    try {
      await navigator.clipboard.writeText(`@${venmoHandle}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard access can fail (unsupported browser, no permission) — non-critical
    }
  };

  return (
    <div className="min-h-screen bg-bm-bg">
      <Header />
      <div className="max-w-5xl mx-auto px-6 py-14 font-sans">
        <h1 className="font-serif text-3xl text-bm-text mb-8">{infoTitle}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            {infoDeadline && (
              <Card icon={<CalendarIcon />} label="Payment & Order Deadline">
                {isPlaceholder(infoDeadline) ? (
                  <p className="text-sm text-bm-text leading-relaxed">
                    Deadline to be announced — check back soon for the exact date.
                  </p>
                ) : (
                  <p className="text-sm text-bm-text leading-relaxed">
                    First round of payments &amp; order forms must be completed by{' '}
                    <span className="font-medium">{infoDeadline}</span>.
                  </p>
                )}
              </Card>
            )}

            {infoVenmo && (
              <Card icon={<CreditCardIcon />} label="Payment Method">
                <p className="text-sm text-bm-text leading-relaxed mb-3">Payments should be made on Venmo to:</p>
                {venmoIsHandle ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={venmoLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-full bg-rho-teal/10 text-rho-teal font-medium text-sm px-3 py-1.5 hover:bg-rho-teal/20 transition-colors"
                    >
                      @{venmoHandle}
                    </a>
                    <button
                      type="button"
                      onClick={handleCopyVenmo}
                      className="inline-flex items-center gap-1 rounded-full border border-bm-border text-bm-muted text-xs px-2.5 py-1.5 hover:text-bm-text hover:border-bm-text transition-colors"
                    >
                      {copied ? <CheckIcon /> : <CopyIcon />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                ) : (
                  <p className="text-sm font-medium text-bm-text">{infoVenmo}</p>
                )}
                <p className="text-xs text-bm-muted mt-3">
                  If you need an additional payment method, contact the fundraising chair.
                </p>
              </Card>
            )}

            {infoShipping && (
              <Card icon={<TruckIcon />} label="Shipping">
                <p className="text-sm text-bm-text leading-relaxed">{infoShipping}</p>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {infoGoal && (
              <Card icon={<TargetIcon />} label="Fundraising Goal" accent>
                <div className="flex items-center gap-4">
                  <span className="shrink-0 inline-flex items-center justify-center rounded-full bg-rho-rose text-white font-serif text-xl px-4 py-2">
                    {infoGoal}
                  </span>
                  <p className="text-sm text-bm-text leading-relaxed">
                    Actives must raise at least $20 by the end of the semester!!
                  </p>
                </div>
              </Card>
            )}

            {hasContact && (
              <Card icon={<UserIcon />} label="Fundraising Chair Contact">
                <p className="text-xs text-bm-muted mb-3">Contact the fundraising chair for any questions or concerns!</p>
                <div className="space-y-1.5">
                  {infoChairName && (
                    <div>
                      <p className="text-sm font-medium text-bm-text">{infoChairName}</p>
                      <p className="text-[11px] uppercase tracking-wide text-bm-muted">Fundraising Chair</p>
                    </div>
                  )}
                  {infoChairPhone && (
                    <a
                      href={`tel:${infoChairPhone.replace(/\D/g, '')}`}
                      className="flex items-center gap-2 text-sm text-bm-text hover:text-rho-teal transition-colors"
                    >
                      <PhoneIcon />
                      {formatPhone(infoChairPhone)}
                    </a>
                  )}
                  {infoChairEmail && (
                    <a
                      href={`mailto:${infoChairEmail}`}
                      className="flex items-center gap-2 text-sm text-bm-text hover:text-rho-teal transition-colors"
                    >
                      <MailIcon />
                      {infoChairEmail}
                    </a>
                  )}
                  {infoChairEmail2 && (
                    <a
                      href={`mailto:${infoChairEmail2}`}
                      className="flex items-center gap-2 text-sm text-bm-text hover:text-rho-teal transition-colors"
                    >
                      <MailIcon />
                      {infoChairEmail2}
                    </a>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>

        {!infoDeadline && !infoVenmo && !infoShipping && !infoGoal && !hasContact && (
          <p className="text-sm text-bm-muted">Nothing here yet — check back soon.</p>
        )}
      </div>
    </div>
  );
};