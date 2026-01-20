import { Button } from "@/components/ui/button";
import { Item, ItemContent, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";
import {
  ChartNoAxesColumnIcon,
  GlobeIcon,
  LandmarkIcon,
  MessageSquareMoreIcon,
  SquareStackIcon,
  UsersRoundIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function IndexPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      {/* Image */}
      <Image
        src="/images/hero.png"
        alt="Hero"
        priority={false}
        width="100"
        height="100"
        sizes="100vw"
        className="w-full rounded-md"
      />
      {/* Title, subtitle */}
      <h2 className="text-3xl font-bold tracking-tight text-center mt-6">
        Drive your Lambo while Agent 402 extracts alpha and trades the market
      </h2>
      <h4 className="text-xl text-muted-foreground tracking-tight text-center mt-2">
        An AI agent for Cronos EVM that utilizes the x402 protocol to execute
        trades powered by private Telegram channels and other premium data
        streams
      </h4>
      {/* Buttons */}
      <div className="flex flex-col md:flex-row gap-2 items-center justify-center mt-4">
        <Link href="/chat">
          <Button variant="default" size="lg">
            <MessageSquareMoreIcon />
            Try Agent 402
          </Button>
        </Link>
        <Link href="https://t.me/agent_402_bot" target="_blank">
          <Button variant="secondary" size="lg">
            <LandmarkIcon />
            Monetize Telegram channel
          </Button>
        </Link>
      </div>
      <Separator className="my-8" />
      {/* Items */}
      <div className="flex flex-col gap-4">
        <Item variant="outline">
          <ItemMedia>
            <GlobeIcon className="size-5" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>12 data streams</ItemTitle>
          </ItemContent>
        </Item>
        <Item variant="outline">
          <ItemMedia>
            <UsersRoundIcon className="size-5" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>42 users</ItemTitle>
          </ItemContent>
        </Item>
        <Item variant="outline">
          <ItemMedia>
            <SquareStackIcon className="size-5" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>1,302 transactions</ItemTitle>
          </ItemContent>
        </Item>
        <Item variant="outline">
          <ItemMedia>
            <ChartNoAxesColumnIcon className="size-5" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>$19,300 volume</ItemTitle>
          </ItemContent>
        </Item>
      </div>
    </div>
  );
}
