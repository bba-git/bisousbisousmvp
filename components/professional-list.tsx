import { Professional } from '@/types';

interface ProfessionalListProps {
  professionals: Professional[];
}

export function ProfessionalList({ professionals }: ProfessionalListProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {professionals.map((professional) => (
        <div key={professional.id} className="rounded-lg border p-6">
          <h3 className="text-lg font-semibold">
            {professional.first_name} {professional.last_name}
          </h3>
          <p className="text-sm text-gray-500">{professional.profession}</p>
          {professional.description && (
            <p className="mt-2 text-sm">{professional.description}</p>
          )}
        </div>
      ))}
    </div>
  );
} 