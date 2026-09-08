import type { ResponsiblePerson, IssueDepartment } from '@fixora/shared';
import { adminDb, isFirestoreConfigured } from '../config/firebaseAdmin.js';

export const DEFAULT_RESPONSIBLE_PEOPLE: ResponsiblePerson[] = [
  {
    id: 'staff-elec-1',
    name: 'Rajesh Kumar (Chief Electrician)',
    department: 'Electrical',
    email: 'rajesh.electric@campus.edu',
    phone: '+91 98765 43210',
    active: true,
  },
  {
    id: 'staff-plumb-1',
    name: 'Suresh Sharma (Sanitary Officer)',
    department: 'Plumbing',
    email: 'suresh.plumb@campus.edu',
    phone: '+91 98765 43211',
    active: true,
  },
  {
    id: 'staff-civil-1',
    name: 'Anil Verma (Civil Works In-Charge)',
    department: 'Civil/Maintenance',
    email: 'anil.civil@campus.edu',
    phone: '+91 98765 43212',
    active: true,
  },
  {
    id: 'staff-clean-1',
    name: 'Sunita Devi (Housekeeping Supervisor)',
    department: 'Cleanliness/Housekeeping',
    email: 'sunita.clean@campus.edu',
    phone: '+91 98765 43213',
    active: true,
  },
  {
    id: 'staff-it-1',
    name: 'Vikas Patel (Network Administrator)',
    department: 'IT/Wi-Fi',
    email: 'vikas.it@campus.edu',
    phone: '+91 98765 43214',
    active: true,
  },
  {
    id: 'staff-hostel-1',
    name: 'Ramesh Singh (Hostel Warden / Estate Manager)',
    department: 'Hostel Maintenance',
    email: 'ramesh.hostel@campus.edu',
    phone: '+91 98765 43215',
    active: true,
  },
  {
    id: 'staff-sec-1',
    name: 'Capt. Mahendra Rao (Security Officer)',
    department: 'Security',
    email: 'mahendra.security@campus.edu',
    phone: '+91 98765 43216',
    active: true,
  },
  {
    id: 'staff-desk-1',
    name: 'Campus Helpdesk',
    department: 'Other',
    email: 'helpdesk@campus.edu',
    phone: '+91 98765 43217',
    active: true,
  },
];

export async function getResponsiblePeople(): Promise<ResponsiblePerson[]> {
  if (process.env.NODE_ENV === 'test' || !isFirestoreConfigured) {
    return DEFAULT_RESPONSIBLE_PEOPLE;
  }
  try {
    const snapshot = await adminDb.collection('responsible_people').get();
    if (!snapshot.empty) {
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<ResponsiblePerson, 'id'>),
      }));
    }
  } catch (err) {
    // Return fallback defaults when offline or if credentials are not present
  }
  return DEFAULT_RESPONSIBLE_PEOPLE;
}

export async function getResponsiblePersonById(id: string): Promise<ResponsiblePerson | undefined> {
  const people = await getResponsiblePeople();
  return people.find((p) => p.id === id);
}

export async function getResponsiblePersonForDepartment(
  dept: IssueDepartment
): Promise<ResponsiblePerson | undefined> {
  const people = await getResponsiblePeople();
  return people.find((p) => p.department === dept && p.active);
}
