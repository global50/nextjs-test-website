'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, MapPin, Users, Globe, Search, Loader2, Plus, ExternalLink, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { AuthModal } from '@/components/auth/AuthModal';

type Company = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  industry: string | null;
  website: string | null;
  logo_url: string | null;
  location: string | null;
  employee_count: string | null;
  founded_year: number | null;
  follower_count?: number;
  job_count?: number;
  isFollowing?: boolean;
};

const mockCompanies: Company[] = [
  {
    id: '1',
    name: 'TechCorp',
    slug: 'techcorp',
    description: 'Leading technology company building innovative solutions for the modern world.',
    industry: 'Technology',
    website: 'https://techcorp.example.com',
    logo_url: null,
    location: 'San Francisco, CA',
    employee_count: '1000-5000',
    founded_year: 2010,
    follower_count: 15420,
    job_count: 12,
  },
  {
    id: '2',
    name: 'DesignHub',
    slug: 'designhub',
    description: 'Creative design agency focused on user experience and digital transformation.',
    industry: 'Design',
    website: 'https://designhub.example.com',
    logo_url: null,
    location: 'New York, NY',
    employee_count: '100-500',
    founded_year: 2015,
    follower_count: 8930,
    job_count: 5,
  },
  {
    id: '3',
    name: 'DataFlow',
    slug: 'dataflow',
    description: 'Data analytics and machine learning platform for enterprise businesses.',
    industry: 'Data & Analytics',
    website: 'https://dataflow.example.com',
    logo_url: null,
    location: 'Seattle, WA',
    employee_count: '500-1000',
    founded_year: 2018,
    follower_count: 6240,
    job_count: 8,
  },
];

const industries = [
  'Technology',
  'Design',
  'Finance',
  'Healthcare',
  'Education',
  'E-commerce',
  'Data & Analytics',
  'Marketing',
  'Other',
];

export default function CompaniesPage() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: '',
    slug: '',
    description: '',
    industry: '',
    website: '',
    location: '',
    employee_count: '',
    founded_year: '',
  });

  useEffect(() => {
    if (user) {
      loadCompanies();
    } else {
      setCompanies(mockCompanies);
      setLoading(false);
    }
  }, [user]);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const companiesWithCounts = await Promise.all(
          data.map(async (company) => {
            const [{ count: followerCount }, { count: jobCount }, { data: followCheck }] = await Promise.all([
              supabase.from('company_followers').select('*', { count: 'exact', head: true }).eq('company_id', company.id),
              supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('company_id', company.id).eq('is_active', true),
              supabase.from('company_followers').select('user_id').eq('company_id', company.id).eq('user_id', user!.id),
            ]);

            return {
              ...company,
              follower_count: followerCount || 0,
              job_count: jobCount || 0,
              isFollowing: followCheck && followCheck.length > 0,
            };
          })
        );
        setCompanies(companiesWithCounts);
      } else {
        setCompanies(mockCompanies);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
      setCompanies(mockCompanies);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async () => {
    if (!user || !newCompany.name || !newCompany.slug) return;

    setCreating(true);
    try {
      const { error } = await supabase.from('companies').insert({
        name: newCompany.name,
        slug: newCompany.slug.toLowerCase().replace(/\s+/g, '-'),
        description: newCompany.description || null,
        industry: newCompany.industry || null,
        website: newCompany.website || null,
        location: newCompany.location || null,
        employee_count: newCompany.employee_count || null,
        founded_year: newCompany.founded_year ? parseInt(newCompany.founded_year) : null,
        owner_id: user.id,
      });

      if (error) throw error;

      setCreateDialogOpen(false);
      setNewCompany({ name: '', slug: '', description: '', industry: '', website: '', location: '', employee_count: '', founded_year: '' });
      loadCompanies();
    } catch (error: any) {
      console.error('Error creating company:', error);
      alert(error.message || 'Failed to create company');
    } finally {
      setCreating(false);
    }
  };

  const handleFollowToggle = async (companyId: string, isFollowing: boolean) => {
    if (!user) return;

    setCompanies((prev) =>
      prev.map((c) =>
        c.id === companyId
          ? {
              ...c,
              isFollowing: !isFollowing,
              follower_count: (c.follower_count || 0) + (isFollowing ? -1 : 1),
            }
          : c
      )
    );

    try {
      if (isFollowing) {
        await supabase.from('company_followers').delete().eq('company_id', companyId).eq('user_id', user.id);
      } else {
        await supabase.from('company_followers').insert({ company_id: companyId, user_id: user.id });
      }
    } catch (error) {
      setCompanies((prev) =>
        prev.map((c) =>
          c.id === companyId
            ? {
                ...c,
                isFollowing: isFollowing,
                follower_count: (c.follower_count || 0) + (isFollowing ? 1 : -1),
              }
            : c
        )
      );
    }
  };

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch =
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesIndustry = industryFilter === 'all' || company.industry === industryFilter;
    return matchesSearch && matchesIndustry;
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Companies</h1>
            <p className="text-muted-foreground">Discover and follow companies</p>
          </div>
          {user && (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Company
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create Company Page</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Company Name *</Label>
                      <Input
                        id="name"
                        value={newCompany.name}
                        onChange={(e) => {
                          setNewCompany({
                            ...newCompany,
                            name: e.target.value,
                            slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                          });
                        }}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="slug">URL Slug *</Label>
                      <Input
                        id="slug"
                        value={newCompany.slug}
                        onChange={(e) => setNewCompany({ ...newCompany, slug: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newCompany.description}
                      onChange={(e) => setNewCompany({ ...newCompany, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="industry">Industry</Label>
                      <Select value={newCompany.industry} onValueChange={(v) => setNewCompany({ ...newCompany, industry: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {industries.map((ind) => (
                            <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={newCompany.location}
                        onChange={(e) => setNewCompany({ ...newCompany, location: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        value={newCompany.website}
                        onChange={(e) => setNewCompany({ ...newCompany, website: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="founded">Founded Year</Label>
                      <Input
                        id="founded"
                        type="number"
                        value={newCompany.founded_year}
                        onChange={(e) => setNewCompany({ ...newCompany, founded_year: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="employees">Employee Count</Label>
                    <Select value={newCompany.employee_count} onValueChange={(v) => setNewCompany({ ...newCompany, employee_count: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1-10</SelectItem>
                        <SelectItem value="11-50">11-50</SelectItem>
                        <SelectItem value="51-200">51-200</SelectItem>
                        <SelectItem value="201-500">201-500</SelectItem>
                        <SelectItem value="501-1000">501-1000</SelectItem>
                        <SelectItem value="1001-5000">1001-5000</SelectItem>
                        <SelectItem value="5001+">5001+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreateCompany} disabled={creating || !newCompany.name || !newCompany.slug} className="w-full">
                    {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Create Company
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={industryFilter} onValueChange={setIndustryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              {industries.map((ind) => (
                <SelectItem key={ind} value={ind}>{ind}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-lg font-medium mb-2">No companies found</h2>
            <p className="text-muted-foreground">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCompanies.map((company) => (
              <Card key={company.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {company.logo_url ? (
                        <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Building2 className="h-7 w-7 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg">
                        <Link href={`/company/${company.slug}`} className="hover:underline">
                          {company.name}
                        </Link>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 flex-wrap">
                        {company.industry && <Badge variant="secondary">{company.industry}</Badge>}
                        {company.location && (
                          <span className="flex items-center gap-1 text-xs">
                            <MapPin className="h-3 w-3" />
                            {company.location}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {company.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{company.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {company.follower_count?.toLocaleString()} followers
                    </div>
                    {company.employee_count && (
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {company.employee_count} employees
                      </div>
                    )}
                    {company.job_count !== undefined && company.job_count > 0 && (
                      <div className="flex items-center gap-1 text-blue-600">
                        {company.job_count} open jobs
                      </div>
                    )}
                    {company.founded_year && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Founded {company.founded_year}
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  {user ? (
                    <Button
                      variant={company.isFollowing ? 'outline' : 'default'}
                      onClick={() => handleFollowToggle(company.id, company.isFollowing || false)}
                    >
                      {company.isFollowing ? 'Following' : 'Follow'}
                    </Button>
                  ) : (
                    <AuthModal defaultView="signup">
                      <Button>Follow</Button>
                    </AuthModal>
                  )}
                  {company.website && (
                    <Button variant="ghost" asChild>
                      <a href={company.website} target="_blank" rel="noopener noreferrer">
                        <Globe className="h-4 w-4 mr-2" />
                        Website
                      </a>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
