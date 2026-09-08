import type { Application, Status } from '@/types/application';
import { localDate } from './applications';
export function demoApplications(): Application[] {
  const examples: [string, string, string, Status, number, string][] = [
    [
      'Linear',
      'Product Designer',
      'Remote, Europe',
      'Interview #2',
      2,
      'Discuss the design process with the team. Prepare two end-to-end case studies.',
    ],
    [
      'Notion',
      'Senior Product Designer',
      'Dublin, Ireland',
      'Applied',
      3,
      'Workspace and collaboration team.',
    ],
    [
      'Vercel',
      'Design Engineer',
      'Remote',
      'Technical Interview',
      4,
      'Review the portfolio and prepare a small interactive prototype.',
    ],
    ['Figma', 'Product Designer', 'London, UK', 'Waiting', 6, 'Applied through the careers page.'],
    [
      'Spotify',
      'UX Designer',
      'Stockholm, Sweden',
      'Interview #1',
      8,
      'First conversation with the hiring team.',
    ],
    [
      'Stripe',
      'Product Designer',
      'Remote, Europe',
      'Offer',
      10,
      'Compare the role, team, and growth opportunities.',
    ],
    ['Airbnb', 'Experience Designer', 'Remote', 'Applied', 12, ''],
    ['Intercom', 'Senior Designer', 'Dublin, Ireland', 'Waiting', 14, ''],
    ['Dropbox', 'Product Designer', 'Remote', 'Rejected', 19, 'Keep an eye on future openings.'],
    ['Miro', 'UX Designer', 'Amsterdam, NL', 'Ghosted', 25, ''],
    [
      'Wise',
      'Product Designer',
      'London, UK',
      'Final Interview',
      32,
      'Final conversation with the design lead.',
    ],
    ['Canva', 'Product Designer', 'Remote', 'Interested', 38, 'Review the role requirements.'],
    ['Monzo', 'Product Designer', 'London, UK', 'Rejected', 45, ''],
    ['Framer', 'Design Engineer', 'Remote', 'Applied', 58, ''],
    ['Loom', 'Product Designer', 'Remote', 'Withdrawn', 70, ''],
    ['Webflow', 'Product Designer', 'Remote', 'Applied', 85, ''],
  ];
  return examples.map(([company_name, position, location, status, days, notes], i) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    const application_date = localDate(date);
    return {
      id: `demo-${i}`,
      user_id: 'demo',
      company_name,
      position,
      location,
      status,
      notes,
      application_date,
      job_link: `https://${company_name.toLowerCase()}.com`,
      created_at: date.toISOString(),
      updated_at: date.toISOString(),
    };
  });
}
