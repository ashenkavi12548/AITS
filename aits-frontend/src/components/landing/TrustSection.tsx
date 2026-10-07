import React from 'react';
import { Lock, Users, Shield, KeyRound, History, Database } from 'lucide-react';

const trustItems = [
  {
    icon: Lock,
    title: 'JWT Authentication',
    description:
      'Secure session management using JSON Web Tokens with httpOnly cookie storage and automatic token refresh.',
    color: '#10a37f',
  },
  {
    icon: Shield,
    title: 'Role-Based Access Control',
    description:
      'System roles — Farm Owner, Manager, Worker, Veterinarian, AI Technician, Government Officer, and Admin — each with appropriate access scopes.',
    color: '#0ea5e9',
  },
  {
    icon: KeyRound,
    title: 'Permission-Based Operations',
    description:
      'Farm-level granular permissions control which operations each staff member can perform, independently of their system role.',
    color: '#f59e0b',
  },
  {
    icon: Users,
    title: 'Farm-Scoped Data Access',
    description:
      'All data access is scoped to the user\'s authorized farm facilities. Users can only access data they are permitted to view.',
    color: '#10a37f',
  },
  {
    icon: History,
    title: 'Audit Trail',
    description:
      'Critical operations including animal registration, status changes, QR replacements, and ownership transfers are recorded in an audit log.',
    color: '#8b5cf6',
  },
  {
    icon: Database,
    title: 'Structured Data Management',
    description:
      'Animal records, identifiers, and operational data are stored in a structured relational database, maintaining referential integrity.',
    color: '#10a37f',
  },
];

export default function TrustSection() {
  return (
    <section id="about" className="py-20 md:py-28 bg-white dark:bg-[#212121]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-[#10a37f] text-[12.5px] font-bold uppercase tracking-widest mb-3">
            Platform Architecture
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#0d0d0d] dark:text-white leading-tight mb-4">
            Built on structured access and accountability
          </h2>
          <p className="text-[16px] text-[#5d5d5d] dark:text-[#b4b4b4] leading-relaxed">
            AITS is designed around controlled access, structured data, and
            operational accountability — the foundation of reliable livestock management.
          </p>
        </div>

        {/* Trust items grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {trustItems.map(({ icon: Icon, title, description, color }) => (
            <div
              key={title}
              className="group p-6 rounded-2xl border border-[#e5e5e5] dark:border-[#303030] bg-[#f9f9f9] dark:bg-[#2f2f2f] hover:border-[#10a37f]/40 hover:shadow-lg hover:shadow-[#10a37f]/5 transition-all duration-200 hover:-translate-y-0.5"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-105"
                style={{
                  backgroundColor: `${color}15`,
                  border: `1px solid ${color}25`,
                }}
              >
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <h3 className="text-[14.5px] font-semibold text-[#0d0d0d] dark:text-white mb-2 leading-snug">
                {title}
              </h3>
              <p className="text-[13.5px] text-[#5d5d5d] dark:text-[#b4b4b4] leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>

        {/* Note */}
        <p className="text-center text-[12.5px] text-[#8e8e8e] dark:text-[#737373] mt-10 max-w-xl mx-auto">
          These are the actual architectural characteristics of the AITS platform as implemented.
          No external certifications or unverified claims are made.
        </p>
      </div>
    </section>
  );
}
