import Link from "next/link";

export default function Home() {
  return <>
    <section className="hero"><div className="hero-inner">
      <div className="eyebrow">African stories · Real voices · Shared wisdom</div>
      <h1>Come closer to the fire.</h1>
      <p>Listen to elders, discover stories from across South Africa, and build a reading ritual your children will carry for life.</p>
      <div className="actions"><Link className="button" href="/stories">Enter the story library</Link><Link className="button secondary" href="/circles">See live circles</Link></div>
    </div></section>
    <section className="section"><h2>The fire is digital. The tradition is real.</h2><p className="muted">Digital Fire Circle reconnects children with reading, elders with purpose, and families with culture.</p>
      <div className="grid"><article className="card"><h3>Live Fire Circles</h3><p>Scheduled, moderated audio gatherings led by vetted elders.</p></article><article className="card"><h3>African Story Library</h3><p>Folktales, history, language, lullabies and moral lessons in real voices.</p></article><article className="card"><h3>Elder Recognition</h3><p>Simple participation tools, cultural attribution and transparent earnings.</p></article></div>
    </section>
  </>;
}
