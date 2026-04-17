/**
 * ThirdPartyScripts — Server Component
 *
 * Reads all tracking IDs from site_config (Supabase) at request time.
 * No env vars needed. Only admins can change these values (RLS enforced).
 * Scripts are loaded with strategy="afterInteractive" for performance.
 */
import Script from 'next/script'
import { getSiteConfig } from '@/lib/site-config'

export async function ThirdPartyScripts() {
  const config = await getSiteConfig()

  const gtmId = config.gtm_id?.trim() || null
  const fbPixelId = config.fb_pixel_id?.trim() || null
  const linkedinPartnerId = config.linkedin_partner_id?.trim() || null
  const tiktokPixelId = config.tiktok_pixel_id?.trim() || null

  return (
    <>
      {/* ── Google Tag Manager ─────────────────────────────────────────── */}
      {gtmId && (
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;
              f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${gtmId}');
            `,
          }}
        />
      )}

      {/* ── Meta (Facebook) Pixel ──────────────────────────────────────── */}
      {fbPixelId && (
        <Script
          id="fb-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window,document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init','${fbPixelId}');
              fbq('track','PageView');
            `,
          }}
        />
      )}

      {/* ── LinkedIn Insight Tag ───────────────────────────────────────── */}
      {linkedinPartnerId && (
        <Script
          id="linkedin-insight"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              _linkedin_partner_id="${linkedinPartnerId}";
              window._linkedin_data_partner_ids=window._linkedin_data_partner_ids||[];
              window._linkedin_data_partner_ids.push(_linkedin_partner_id);
              (function(l){if(!l){window.lintrk=function(a,b){window.lintrk.q.push([a,b])};
              window.lintrk.q=[]}
              var s=document.getElementsByTagName("script")[0];
              var b=document.createElement("script");
              b.type="text/javascript";b.async=true;
              b.src="https://snap.licdn.com/li.lms-analytics/insight.min.js";
              s.parentNode.insertBefore(b,s);})(window.lintrk);
            `,
          }}
        />
      )}

      {/* ── TikTok Pixel ──────────────────────────────────────────────── */}
      {tiktokPixelId && (
        <Script
          id="tiktok-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
              ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
              ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
              for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
              ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
              ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";
              ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;
              ttq._o=ttq._o||{};ttq._o[e]=n||{};
              var o=document.createElement("script");o.type="text/javascript";o.async=true;
              o.src=i+"?sdkid="+e+"&lib="+t;
              var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
              ttq.load('${tiktokPixelId}');ttq.page();
              }(window,document,'ttq');
            `,
          }}
        />
      )}
    </>
  )
}

/**
 * GTM noscript fallback — rendered as first child of <body>.
 * Also a server component that reads from site_config.
 */
export async function GtmNoScript() {
  const config = await getSiteConfig()
  const gtmId = config.gtm_id?.trim() || null

  if (!gtmId) return null

  return (
    <noscript>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
        title="GTM"
      />
    </noscript>
  )
}
