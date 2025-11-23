import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Calendar, ExternalLink } from 'lucide-react';
import { ImpactEvidence } from '@/types/organizations';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface EvidenceListProps {
    evidence: ImpactEvidence[];
    onDelete?: (id: string) => Promise<void>;
    showTargetInfo?: boolean;
}

export const EvidenceList: React.FC<EvidenceListProps> = ({
    evidence,
    onDelete,
    showTargetInfo = false
}) => {
    if (!evidence || evidence.length === 0) {
        return (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
                <p className="text-gray-500">No impact evidence found.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {evidence.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                    {item.media_urls && item.media_urls.length > 0 && (
                        <div className="aspect-video w-full overflow-hidden bg-gray-100 relative group">
                            <img
                                src={item.media_urls[0]}
                                alt={item.title}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            {item.media_urls.length > 1 && (
                                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                                    +{item.media_urls.length - 1} more
                                </div>
                            )}
                        </div>
                    )}

                    <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-start gap-2">
                            <div>
                                <CardTitle className="text-lg line-clamp-1">{item.title}</CardTitle>
                                {showTargetInfo && (
                                    <CardDescription className="text-xs mt-1">
                                        For {item.target_type}: <span className="font-medium">{item.target_id}</span>
                                    </CardDescription>
                                )}
                            </div>
                            <Badge variant={item.status === 'approved' ? 'default' : 'secondary'}>
                                {item.status}
                            </Badge>
                        </div>
                    </CardHeader>

                    <CardContent className="p-4 pt-2">
                        <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                            {item.description}
                        </p>

                        <div className="flex items-center justify-between mt-auto pt-2 border-t">
                            <div className="flex items-center text-xs text-gray-500">
                                <Calendar className="w-3 h-3 mr-1" />
                                {new Date(item.submitted_at).toLocaleDateString()}
                            </div>

                            {onDelete && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Evidence?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete this impact evidence.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => onDelete(item.id)} className="bg-red-600 hover:bg-red-700">
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};
