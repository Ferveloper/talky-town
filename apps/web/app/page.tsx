import { ArrowRight, BadgeCheck, BookOpen, ShieldCheck, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { demoProfiles, initialMissions } from "@talkytown/shared";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function HomePage() {
  const featuredMission = initialMissions.find((mission) => mission.code === "animal-adventure");

  return (
    <main className="min-h-screen bg-[#fff8df] text-slate-900">
      <section className="town-sky relative overflow-hidden px-6 py-8 sm:px-10 lg:px-16">
        <div className="mx-auto grid max-w-6xl gap-10 lg:min-h-[78vh] lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="relative z-10 max-w-2xl py-8 lg:py-14">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Mock AI ready. No API key needed.
            </div>

            <h1 className="text-5xl font-black tracking-normal text-slate-950 sm:text-6xl lg:text-7xl">
              TalkyTown
            </h1>
            <p className="mt-5 max-w-xl text-xl leading-8 text-slate-700">
              A playful town where children practice English with friendly avatars, short missions,
              gentle corrections and visible progress.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <a href="#demo-data">
                  <Sparkles className="h-5 w-5" />
                  Enter demo town
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href={`${apiUrl}/health`}>
                  API health
                  <ArrowRight className="h-5 w-5" />
                </a>
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 text-sm font-semibold text-slate-700">
              <span className="rounded-full bg-white/85 px-4 py-2 shadow-sm">Web :3000</span>
              <span className="rounded-full bg-white/85 px-4 py-2 shadow-sm">API :3001</span>
              <span className="rounded-full bg-white/85 px-4 py-2 shadow-sm">Docs /docs</span>
            </div>
          </div>

          <div className="relative min-h-[440px]">
            <div className="absolute bottom-0 left-1/2 h-64 w-[92%] -translate-x-1/2 rounded-t-[3rem] bg-emerald-200" />
            <div className="absolute bottom-16 left-[10%] h-40 w-28 rounded-t-3xl bg-sky-400 town-block" />
            <div className="absolute bottom-16 left-[29%] h-56 w-32 rounded-t-3xl bg-amber-300 town-block" />
            <div className="absolute bottom-16 right-[28%] h-44 w-28 rounded-t-3xl bg-rose-400 town-block" />
            <div className="absolute bottom-16 right-[8%] h-52 w-32 rounded-t-3xl bg-teal-400 town-block" />
            <div className="absolute bottom-20 left-[36%] rounded-3xl bg-white px-5 py-4 shadow-soft">
              <p className="text-sm font-bold text-slate-500">Today mission</p>
              <p className="mt-1 text-lg font-black text-slate-950">
                {featuredMission?.title ?? "Animal Adventure"}
              </p>
              <p className="mt-1 text-sm text-slate-600">+30 XP</p>
            </div>
            <div className="absolute bottom-8 left-[14%] flex h-28 w-28 items-center justify-center rounded-full bg-white text-5xl shadow-soft">
              L
            </div>
            <div className="absolute bottom-8 right-[18%] flex h-24 w-24 items-center justify-center rounded-full bg-white text-4xl shadow-soft">
              M
            </div>
          </div>
        </div>
      </section>

      <section id="demo-data" className="bg-white px-6 py-8 sm:px-10 lg:px-16">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <BookOpen className="h-6 w-6 text-sky-600" />
            <h2 className="mt-3 text-lg font-black">Demo profiles</h2>
            <p className="mt-2 text-sm text-slate-600">
              {demoProfiles.map((profile) => `${profile.alias} (${profile.age})`).join(" and ")}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <BadgeCheck className="h-6 w-6 text-amber-500" />
            <h2 className="mt-3 text-lg font-black">Seed data</h2>
            <p className="mt-2 text-sm text-slate-600">
              Avatars, missions and badges are ready for the Phase 2 database.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <ShieldCheck className="h-6 w-6 text-emerald-600" />
            <h2 className="mt-3 text-lg font-black">API</h2>
            <p className="mt-2 text-sm text-slate-600">Health endpoint: {apiUrl}/health</p>
          </div>
        </div>
      </section>
    </main>
  );
}
