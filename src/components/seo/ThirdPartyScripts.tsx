/**
 * ThirdPartyScripts — Server Component
 *
 * Reads tracking IDs from site_config + custom scripts from tracking_scripts
 * (migration 012). All gated by Consent Mode v2 — pixels só disparam após
 * o usuário aceitar via CookieConsent.
 *
 * Order matters:
 *   1. ConsentModeInit (sync inline) — DEFAULT 'denied' antes de qualquer pixel
 *   2. Custom scripts head/body_start (admin-controlled)
 *   3. GTM (orquestrador) + GA4 standalone (paralelo) + Pixels
 *   4. Custom scripts body_end
 */
import Script from 'next/script'
import { headers } from 'next/headers'
import { getSiteConfig } from '@/lib/site-config'
import { createSupabaseServerClient } from '@/lib/supabase-server'

async function getNonce(): Promise<string | undefined> {
  const h = await headers()
  return h.get('x-nonce') ?? undefined
}

interface TrackingScript {
  id: string
  name: string
  placement: 'head' | 'body_start' | 'body_end'
  code: string
  position: number
}

async function getTrackingScripts(
  placement: TrackingScript['placement']
): Promise<TrackingScript[]> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase
      .from('tracking_scripts')
      .select('id, name, placement, code, position')
      .eq('active', true)
      .eq('placement', placement)
      .order('position')
    return (data ?? []) as TrackingScript[]
  } catch {
    return []
  }
}

/**
 * ConsentModeInit — script inline SYNC que precisa rodar antes de qualquer
 * tag de tracking. Define defaults 'denied' p/ Consent Mode v2.
 * Aceita nonce do middleware CSP para autorizar inline.
 */
export function ConsentModeInit({ nonce }: { nonce?: string }) {
  const inlineScript = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    window.gtag = gtag;
    // Defaults LGPD: tudo denied até o usuário decidir via banner
    gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
      functionality_storage: 'granted',
      security_storage: 'granted',
      personalization_storage: 'denied',
      wait_for_update: 500
    });
    gtag('set', 'ads_data_redaction', true);
    gtag('set', 'url_passthrough', true);
    // Re-aplica consent salvo do localStorage (após hidratação completa do CookieConsent
    // o estado é refletido via 'consent','update'); aqui é só pré-warming.
    try {
      var stored = localStorage.getItem('moreja:consent');
      if (stored) {
        var c = JSON.parse(stored);
        if (c && c.status && c.status !== 'pending') {
          gtag('consent', 'update', {
            ad_storage: c.marketing ? 'granted' : 'denied',
            ad_user_data: c.marketing ? 'granted' : 'denied',
            ad_personalization: c.marketing ? 'granted' : 'denied',
            analytics_storage: c.analytics ? 'granted' : 'denied',
            functionality_storage: 'granted',
            security_storage: 'granted',
            personalization_storage: c.functional ? 'granted' : 'denied'
          });
        }
      }
    } catch (e) {}
  `
  return (
    <Script
      id="consent-mode-init"
      strategy="beforeInteractive"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: inlineScript }}
    />
  )
}

export async function ThirdPartyScripts() {
  const config = await getSiteConfig()
  const nonce = await getNonce()

  const gtmId = config.gtm_id?.trim() || null
  const ga4Id = config.ga4_measurement_id?.trim() || null
  const fbPixelId = config.fb_pixel_id?.trim() || null
  const linkedinPartnerId = config.linkedin_partner_id?.trim() || null
  const tiktokPixelId = config.tiktok_pixel_id?.trim() || null
  const clarityId = config.clarity_id?.trim() || null
  const hotjarId = config.hotjar_id?.trim() || null
  const hotjarVersion = config.hotjar_version?.trim() || '6'

  const customHead = await getTrackingScripts('head')
  const customBodyEnd = await getTrackingScripts('body_end')

  return (
    <>
      {/* ── Custom scripts (head) — controlados pelo admin ─────────────── */}
      {customHead.map((s) => (
        <Script nonce={nonce}
          key={s.id}
          id={`custom-head-${s.id}`}
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: s.code }}
        />
      ))}

      {/* ── Google Tag Manager ─────────────────────────────────────────── */}
      {gtmId && (
        <Script nonce={nonce}
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

      {/* ── GA4 standalone (sem precisar de GTM) ──────────────────────── */}
      {ga4Id && (
        <>
          <Script nonce={nonce}
            id="ga4-script"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
          />
          <Script nonce={nonce}
            id="ga4-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                gtag('js', new Date());
                gtag('config', '${ga4Id}', {
                  send_page_view: true,
                  cookie_flags: 'SameSite=None;Secure'
                });
              `,
            }}
          />
        </>
      )}

      {/* ── Meta (Facebook) Pixel — respeita Consent Mode ad_storage ────── */}
      {fbPixelId && (
        <Script nonce={nonce}
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
              // Só dispara PageView se houver consent marketing — gate runtime
              try {
                var c = JSON.parse(localStorage.getItem('moreja:consent') || '{}');
                if (c.marketing) fbq('track','PageView');
              } catch(e) { /* ignore */ }
            `,
          }}
        />
      )}

      {/* ── LinkedIn Insight Tag ───────────────────────────────────────── */}
      {linkedinPartnerId && (
        <Script nonce={nonce}
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
        <Script nonce={nonce}
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
              ttq.load('${tiktokPixelId}');
              try {
                var c = JSON.parse(localStorage.getItem('moreja:consent') || '{}');
                if (c.marketing) ttq.page();
              } catch(e) { /* ignore */ }
              }(window,document,'ttq');
            `,
          }}
        />
      )}

      {/* ── Microsoft Clarity (analytics — heatmaps + recordings) ─────── */}
      {clarityId && (
        <Script nonce={nonce}
          id="clarity-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                  try {
                    var consent = JSON.parse(localStorage.getItem('moreja:consent') || '{}');
                    if (!consent.analytics) return;
                  } catch(e) {}
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${clarityId}");
            `,
          }}
        />
      )}

      {/* ── Hotjar ────────────────────────────────────────────────────── */}
      {hotjarId && (
        <Script nonce={nonce}
          id="hotjar-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var consent = JSON.parse(localStorage.getItem('moreja:consent') || '{}');
                if (consent.analytics) {
                  (function(h,o,t,j,a,r){
                      h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
                      h._hjSettings={hjid:${hotjarId},hjsv:${hotjarVersion}};
                      a=o.getElementsByTagName('head')[0];
                      r=o.createElement('script');r.async=1;
                      r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
                      a.appendChild(r);
                  })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
                }
              } catch(e) {}
            `,
          }}
        />
      )}

      {/* ── Custom scripts (body_end) — controlados pelo admin ─────────── */}
      {customBodyEnd.map((s) => (
        <Script nonce={nonce}
          key={s.id}
          id={`custom-body-end-${s.id}`}
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{ __html: s.code }}
        />
      ))}
    </>
  )
}

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

/**
 * BodyStartScripts — Server Component renderizado como primeiro filho de
 * <body>. Útil para custom scripts que precisam estar antes do <main> (ex:
 * GTM noscript de tags concorrentes, banners de A/B test).
 */
export async function BodyStartScripts() {
  const customBodyStart = await getTrackingScripts('body_start')
  if (customBodyStart.length === 0) return null
  const nonce = await getNonce()
  return (
    <>
      {customBodyStart.map((s) => (
        <Script
          nonce={nonce}
          key={s.id}
          id={`custom-body-start-${s.id}`}
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: s.code }}
        />
      ))}
    </>
  )
}
