
import Image from 'next/image';

import Link from "next/link";

 //  export function Home1() {
 //  return (
 //      <div className={styles.container}>
 //      <Head>
 //          <title>Sophie's Website</title>
 //          <meta name="description" content="Starter Web Site" />
 //          <link rel="icon" href="/favicon.ico" />
 //      </Head>

 //  ;
 //  }

export default function Home() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans">
            <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white sm:items-start">
                <Image src="/stitch-logo.png"
                    alt="Coconut logo"
                    width={200}
                    height={170}
                    priority />
                <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
                    <h1 className="max-w-md text-3xl font-semibold leading-10 tracking-tight text-black">
                        Welcome to <a href="https://sophie.kokona.website">Sophie</a>&apos;s Website!
                    </h1>
                    <p className="max-w-lg text-lg leading-8 text-zinc-600 dark:text-zinc-400">
                        Hello! I am Sophie, and I love Stitch movies from Disney.
                        This website is built to share my favorite Stitch movies and related content with you.
                    </p>
                    <p className="max-w-md txt-lg leading-8 text-zinc-600">
                        Explore the links below to find more about Stitch and my favorite movies:
                    </p>
                    <ul>
                        <li className="max-w-md text-lg leading-8 text-zinc-600">
                            <a href="https://movies.disney.com/lilo-and-stitch-2025" className="font-medium text-zinc-950">
                                Lilo & Stitch (2025 Movie)
                            </a>

                        </li>
                        <li className="max-w-md text-lg leading-8 text-zinc-600">
                            <a href="https://movies.disney.com/lilo-stitch-2-stitch-has-a-glitch" className="font-medium text-zinc-950">
                                Lilo & Stitch 2: Stitch Has a Glitch
                            </a>
                        </li>
                        <li className="max-w-md text-lg leading-8 text-zinc-600">
                            <a href="https://movies.disney.com/leroy-and-stitch" className="font-medium text-zinc-950">
                                Leroy & Stitch
                            </a>
                        </li>
                        <li className="max-w-md text-lg leading-8 text-zinc-600">
                            <a href="https://movies.disney.com/lilo-stitch" className="font-medium text-zinc-950">
                                Lilo & Stitch (2002 Movie)
                            </a>
                        </li>
                        <li className="max-w-md text-lg leading-8 text-zinc-600">
                            <a href="https://movies.disney.com/lilo-and-stitchs-island-of-adventures" className="font-medium text-zinc-950">
                                Lilo & Stitch's Island Of Adventures
                            </a>
                        </li>
                    </ul>
                </div>
                <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
                    <a
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[200px]"
                        href="https://kokona.website"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Image
                            className="dark:invert"
                            src="/vercel.svg"
                            alt="Vercel logomark"
                            width={1}
                            height={16}
                        />
                        Parent Website
                    </a>
                </div>
            </main>
        </div>
    );
}
