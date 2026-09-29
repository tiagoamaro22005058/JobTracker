import { ArrowUpRight, Globe, MapPin, Laptop } from 'lucide-react';

const groups = [
  {
    title: 'Start your search',
    description: 'Explore opportunities across industries and career stages.',
    icon: Globe,
    sites: [
      {
        name: 'LinkedIn',
        initials: 'in',
        url: 'https://www.linkedin.com/jobs/',
        description: 'Find roles, explore companies, and connect with people in your industry.',
        tag: 'Global · All industries',
      },
      {
        name: 'Indeed',
        initials: 'i',
        url: 'https://pt.indeed.com/',
        description:
          'Search by job title, company, or location, with company reviews and salary information.',
        tag: 'Portugal · All industries',
      },
    ],
  },
  {
    title: 'Opportunities in Portugal',
    description: 'Look closer to home with local job boards.',
    icon: MapPin,
    sites: [
      {
        name: 'Net-Empregos',
        initials: 'NE',
        url: 'https://www.net-empregos.com/',
        description: 'Browse vacancies across Portugal, from local businesses to larger employers.',
        tag: 'Portugal · All industries',
      },
      {
        name: 'ITJobs',
        initials: 'IT',
        url: 'https://www.itjobs.pt/',
        description:
          'Explore technology and IT vacancies, plus training opportunities in Portugal.',
        tag: 'Portugal · Technology',
      },
    ],
  },
  {
    title: 'Work remotely',
    description:
      'Discover remote roles. Check each listing for country and time-zone requirements.',
    icon: Laptop,
    sites: [
      {
        name: 'We Work Remotely',
        initials: 'WW',
        url: 'https://weworkremotely.com/',
        description:
          'Browse remote opportunities in programming, design, customer support, and more.',
        tag: 'Remote · Multiple industries',
      },
      {
        name: 'Remote OK',
        initials: 'OK',
        url: 'https://remoteok.com/',
        description:
          'Find remote roles in technology, marketing, and other fields around the world.',
        tag: 'Remote · Multiple industries',
      },
    ],
  },
] as const;

export function FindJobs() {
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR NEXT OPPORTUNITY STARTS HERE</span>
          <h1>
            Find jobs
            <span className="heading-dot" />
          </h1>
          <p>
            Discover somewhere new to look. Find a role you like, then track it on your Dashboard.
          </p>
        </div>
      </div>
      <div className="job-directory">
        <p className="job-directory-note">6 places to explore · Links open in a new tab.</p>
        {groups.map(({ title, description, icon: Icon, sites }, index) => (
          <section
            key={title}
            aria-labelledby={`job-group-${index}`}
            className="job-directory-group"
          >
            <div className="job-directory-heading">
              <Icon size={20} aria-hidden="true" />
              <div>
                <h2 id={`job-group-${index}`}>{title}</h2>
                <p>{description}</p>
              </div>
            </div>
            <div className="job-directory-grid">
              {sites.map((site) => (
                <a
                  key={site.name}
                  className="job-site-card"
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${site.name} — opens in a new tab`}
                >
                  <div className="job-site-top">
                    <span className="job-site-mark" aria-hidden="true">
                      {site.initials}
                    </span>
                    <ArrowUpRight size={20} aria-hidden="true" />
                  </div>
                  <h3>{site.name}</h3>
                  <p>{site.description}</p>
                  <div className="job-site-footer">
                    <span>{site.tag}</span>
                    <strong>
                      Explore jobs <ArrowUpRight size={14} aria-hidden="true" />
                    </strong>
                  </div>
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
