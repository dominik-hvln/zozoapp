export interface Scan {
    id: string;
    scan_time: string;
    latitude: number | null;
    longitude: number | null;
    assignments: {
        children: { name: string };
        tattoo_instances: { unique_code: string };
    };
}

export interface Assignment {
    id: string;
    is_active: boolean;
    children: { name: string } | null;
    tattoo_instances: { unique_code: string } | null;
}