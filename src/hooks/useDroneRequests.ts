"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase";

export function useDroneRequests(
    onNewRequest: (request: any) => void
) {

    useEffect(() => {

        const supabase = createClient();

        const channel = supabase
            .channel("admin-drone-requests")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "drone_requests",
                },
                (payload) => {
                    console.log(
                        "New drone request:",
                        payload.new
                    );
                    onNewRequest(payload.new);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };

    }, [onNewRequest]);
}