import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Camera } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { organizationService } from '@/lib/organizationService';
import { evidenceService } from '@/services/evidenceService';
import { EvidenceList } from '@/components/evidence/EvidenceList';
import { EvidenceUploadForm } from '@/components/evidence/EvidenceUploadForm';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ImpactEvidence } from '@/types/organizations';
import { useToast } from '@/hooks/use-toast';

const OrganizationEvidence: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [organization, setOrganization] = useState<any | null>(null);
    const [evidence, setEvidence] = useState<ImpactEvidence[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const { data: orgData, error: orgErr } = await organizationService.getCurrentUserOrganization();

                if (orgErr || !orgData) {
                    toast({
                        title: "Error",
                        description: "Could not load organization data",
                        variant: "destructive"
                    });
                    return;
                }

                setOrganization(orgData);

                const evidenceData = await evidenceService.getOrganizationEvidence(orgData.id);
                setEvidence(evidenceData);
            } catch (error) {
                console.error('Error loading evidence:', error);
                toast({
                    title: "Error",
                    description: "Failed to load impact evidence",
                    variant: "destructive"
                });
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [toast]);

    const handleEvidenceSubmitted = async () => {
        if (organization) {
            const evidenceData = await evidenceService.getOrganizationEvidence(organization.id);
            setEvidence(evidenceData);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2">Loading evidence...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </Button>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Impact Evidence</h1>
                    <p className="text-gray-600">
                        Showcase the impact of your organization and campaigns
                    </p>
                </div>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="flex items-center gap-2">
                            <Camera className="w-4 h-4" />
                            Add New Evidence
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        {organization && (
                            <EvidenceUploadForm
                                targetType="organization"
                                targetId={organization.slug || organization.id}
                                onSuccess={handleEvidenceSubmitted}
                            />
                        )}
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Evidence Gallery</CardTitle>
                    <CardDescription>
                        All impact evidence submitted for {organization?.name} and its campaigns
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <EvidenceList
                        evidence={evidence}
                        showTargetInfo={true}
                    />
                </CardContent>
            </Card>
        </div>
    );
};

export default OrganizationEvidence;
