"use client";

import { LogInIcon, UserIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export function HeaderMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Avatar className="size-6">
            <AvatarImage src="" className="object-cover w-full h-full" />
            <AvatarFallback className="bg-accent">
              <UserIcon className="size-3 text-accent-foreground" />
            </AvatarFallback>
          </Avatar>
          Demo
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>
          <LogInIcon />
          Sign in <span className="text-muted-foreground">(Coming soon)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
