'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Briefcase, MapPin, Clock, DollarSign, Search, Loader2, Building2, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { AuthModal } from '@/components/auth/AuthModal';

type Job = {
  id: string;
  title: string;
  description: string;
  location: string;
  job_type: string;
  experience_level: string;
  salary_min: number | null;
  salary_max: number | null;
  skills: string[];
  created_at: string;
  company: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    industry: string;
  };
};

const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Senior Software Engineer',
    description: 'We are looking for an experienced software engineer to join our team and help build the next generation of our platform.',
    location: 'San Francisco, CA',
    job_type: 'full-time',
    experience_level: 'senior',
    salary_min: 150000,
    salary_max: 200000,
    skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    company: { id: '1', name: 'TechCorp', slug: 'techcorp', logo_url: null, industry: 'Technology' },
  },
  {
    id: '2',
    title: 'Product Designer',
    description: 'Join our design team to create beautiful and intuitive user experiences for millions of users.',
    location: 'Remote',
    job_type: 'full-time',
    experience_level: 'mid',
    salary_min: 100000,
    salary_max: 140000,
    skills: ['Figma', 'UI/UX', 'Design Systems', 'Prototyping'],
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    company: { id: '2', name: 'DesignHub', slug: 'designhub', logo_url: null, industry: 'Design' },
  },
  {
    id: '3',
    title: 'Data Scientist',
    description: 'We need a data scientist to help us derive insights from our vast datasets and build predictive models.',
    location: 'New York, NY',
    job_type: 'full-time',
    experience_level: 'senior',
    salary_min: 130000,
    salary_max: 180000,
    skills: ['Python', 'Machine Learning', 'SQL', 'TensorFlow'],
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    company: { id: '3', name: 'DataFlow', slug: 'dataflow', logo_url: null, industry: 'Data & Analytics' },
  },
];

export default function JobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (user) {
      loadJobs();
    } else {
      setJobs(mockJobs);
      setLoading(false);
    }
  }, [user]);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          company:company_id (id, name, slug, logo_url, industry)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data && data.length > 0 ? data : mockJobs);
    } catch (error) {
      console.error('Error loading jobs:', error);
      setJobs(mockJobs);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!user || !selectedJob) return;

    setApplying(true);
    try {
      await supabase.from('job_applications').insert({
        job_id: selectedJob.id,
        user_id: user.id,
        cover_letter: coverLetter,
        status: 'pending',
      });
      setApplyDialogOpen(false);
      setCoverLetter('');
      alert('Application submitted successfully!');
    } catch (error: any) {
      if (error.code === '23505') {
        alert('You have already applied to this job.');
      } else {
        console.error('Error applying:', error);
        alert('Failed to submit application. Please try again.');
      }
    } finally {
      setApplying(false);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesLocation =
      !locationFilter || job.location.toLowerCase().includes(locationFilter.toLowerCase());
    const matchesType = jobTypeFilter === 'all' || job.job_type === jobTypeFilter;
    return matchesSearch && matchesLocation && matchesType;
  });

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return 'Salary not disclosed';
    if (min && max) return `$${(min / 1000).toFixed(0)}k - $${(max / 1000).toFixed(0)}k`;
    if (min) return `From $${(min / 1000).toFixed(0)}k`;
    return `Up to $${(max! / 1000).toFixed(0)}k`;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Jobs</h1>
          <p className="text-muted-foreground">Find your next opportunity</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs, companies, or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="relative flex-1 sm:max-w-[200px]">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Location"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Job type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="full-time">Full-time</SelectItem>
              <SelectItem value="part-time">Part-time</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="internship">Internship</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-lg font-medium mb-2">No jobs found</h2>
            <p className="text-muted-foreground">Try adjusting your search filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        {job.company.logo_url ? (
                          <img
                            src={job.company.logo_url}
                            alt={job.company.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Building2 className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{job.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Link
                            href={`/company/${job.company.slug}`}
                            className="hover:underline font-medium text-gray-700"
                          >
                            {job.company.name}
                          </Link>
                          <span className="text-gray-400">|</span>
                          <span>{job.company.industry}</span>
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary">{job.job_type}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">{job.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {job.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {formatSalary(job.salary_min, job.salary_max)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill) => (
                      <Badge key={skill} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  {user ? (
                    <Dialog open={applyDialogOpen && selectedJob?.id === job.id} onOpenChange={(open) => {
                      setApplyDialogOpen(open);
                      if (open) setSelectedJob(job);
                    }}>
                      <DialogTrigger asChild>
                        <Button onClick={() => setSelectedJob(job)}>Apply Now</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Apply for {job.title}</DialogTitle>
                          <DialogDescription>at {job.company.name}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label htmlFor="cover-letter">Cover Letter (Optional)</Label>
                            <Textarea
                              id="cover-letter"
                              placeholder="Tell us why you're a great fit for this role..."
                              value={coverLetter}
                              onChange={(e) => setCoverLetter(e.target.value)}
                              rows={6}
                            />
                          </div>
                          <Button onClick={handleApply} disabled={applying} className="w-full">
                            {applying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Submit Application
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <AuthModal defaultView="signup">
                      <Button>Sign up to Apply</Button>
                    </AuthModal>
                  )}
                  <Button variant="ghost" className="ml-2">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
