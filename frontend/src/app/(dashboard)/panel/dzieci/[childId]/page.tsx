'use client';

import { useParams } from 'next/navigation';

// W przyszłości będziemy tu pobierać i edytować dane dziecka
export default function DzieckoEditPage() {
    const params = useParams();
    const childId = params.childId;

    return (
        <div className="p-4 lg:p-8">
            <h1 className="text-3xl font-bold">Edycja Profilu Dziecka</h1>
            <p className="text-muted-foreground mt-2">
                Tutaj w przyszłości pojawi się formularz do edycji danych dziecka o ID:
                <span className="font-mono bg-gray-100 p-1 rounded">{childId}</span>
            </p>
        </div>
    );
}