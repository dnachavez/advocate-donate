import React, { useEffect, useState } from 'react';
import { ImpactEvidence } from '@/types/organizations';
import { evidenceService } from '@/services/evidenceService';
import { Loader2 } from "lucide-react";
import { EvidenceList } from './EvidenceList';

interface EvidenceGalleryProps {
    targetType: 'campaign' | 'organization';
    targetId: string;
    refreshTrigger?: number; // Prop to trigger refresh from parent
    onEdit?: (evidence: ImpactEvidence) => void;
    onDelete?: (id: string) => Promise<void>;
}

export const EvidenceGallery: React.FC<EvidenceGalleryProps> = ({
    targetType,
    targetId,
    refreshTrigger,
    onEdit,
    onDelete
}) => {
    const [evidence, setEvidence] = useState<ImpactEvidence[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvidence = async () => {
            try {
                const data = await evidenceService.getEvidenceForTarget(targetType, targetId);
                setEvidence(data);
            } catch (error) {
                console.error('Error fetching evidence:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvidence();
    }, [targetType, targetId, refreshTrigger]);

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <EvidenceList
            evidence={evidence}
            onEdit={onEdit}
            onDelete={onDelete}
        />
    );
};
