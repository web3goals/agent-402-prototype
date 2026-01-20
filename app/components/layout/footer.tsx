"use client";

import { appConfig } from "@/config/app";
import { Button } from "../ui/button";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-background border-t py-6 md:py-0">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 md:h-24">
        <p className="text-balance text-center md:text-left text-sm leading-loose text-muted-foreground">
          Built by
          <Link href={appConfig.developer.url} target="_blank">
            <Button variant="link" className="p-1">
              {appConfig.developer.name}
            </Button>
          </Link>
          © 2026
        </p>
      </div>
    </footer>
  );
}
