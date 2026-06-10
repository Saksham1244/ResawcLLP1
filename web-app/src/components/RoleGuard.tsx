"use client";

import { useRole, UserRole } from "@/context/RoleContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Lock } from "lucide-react";

type Props = {
  allowedRoles: UserRole[];
  redirectTo?: string;
  children: React.ReactNode;
};

export function RoleGuard({ allowedRoles, redirectTo, children }: Props) {
  const { user } = useRole();
  const router = useRouter();
  const allowed = allowedRoles.includes(user.role);

  useEffect(() => {
    if (!allowed && redirectTo) {
      router.replace(redirectTo);
    }
  }, [allowed, redirectTo, router]);

  if (!allowed) {
    return (
      <div style={{
        minHeight: '60vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '1rem'
      }}>
        <div style={{
          width: '60px', height: '60px', borderRadius: '18px',
          background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Lock size={26} color="#f43f5e" />
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Access Restricted</h2>
        <p className="text-sm text-muted" style={{ maxWidth: '320px', lineHeight: 1.6 }}>
          You don't have permission to view this page. Contact your Admin if you think this is a mistake.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
