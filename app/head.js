/* eslint-disable @next/next/no-page-custom-font */
/* eslint-disable @next/next/inline-script-id */
import Script from 'next/script';

export default function CustomHeadImports() {
    return (
        <>
            <meta charSet="utf-8" />
            <meta
                name="viewport"
                content="width=device-width, initial-scale=1, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no"
            />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="black" />
            <meta name="theme-color" content="#000000" />
            <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
            <meta httpEquiv="expires" content="no-cache" />
            <meta httpEquiv="pragma" content="no-cache" />
            <meta name="author" content="Centro Nacional de Información Geográfica" />
            <meta name="title" content={process.env.PAGE_TITLE} />
            <meta
                name="description"
                content="Un proyecto colaborativo de producción y publicación mediante servicios web de datos espaciales de cobertura nacional."
            />
            <meta
                name="keywords"
                content="Visualizadores, IDEE, Instituto Geográfico Nacional, IGN, Centro Nacional de Información Geográfica, CNIG, Nombres Geográficos, Nomenclator Geográfico Nacional, Nomenclator Geográfico Básico de España, NGN, NGBE, Cartografía, Mapas"
            />
            <meta name="rating" content="General" />
            <meta name="robots" content="FOLLOW,INDEX" />
            <meta name="revisit-after" content="1 weeks" />

            <title>{process.env.PAGE_TITLE}</title>

            {/* Open Graph */}
            <meta property="og:type" content="article" />
            <meta property="og:title" content={process.env.PAGE_TITLE} />
            <meta property="og:description" content={process.env.PAGE_TITLE} />
            <meta property="og:site_name" content={process.env.PAGE_TITLE} />
            <meta property="og:locale" content="es_ES" />

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:site" content="@IGNSpain" />
            <meta name="twitter:creator" content="@IGNSpain" />

            {/* Geo Positioning */}
            <meta name="geo.region" content="ES-M" />
            <meta name="geo.placename" content="Madrid" />
            <meta name="geo.position" content="40.404460;-3.710000" />
            <meta name="ICBM" content="40.404460, -3.710000" />
            <meta name="DC.title" content={process.env.PAGE_TITLE} />

            {/* Favicon and Manifest */}
            {/* <link rel="manifest" href="/manifest.json" />
            <link rel="shortcut icon" href="/favicon.ico" /> */}
            {/* Fonts */}
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100..900;1,100..900&display=swap" />
            {/* CSS Assets */}
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"></link>
            <link rel="stylesheet" href={`${process.env.NEXT_PUBLIC_API_IDEE_URL}/assets/css/apiidee.ol.min.css`} />
            <link rel="stylesheet" href={`${process.env.NEXT_PUBLIC_API_IDEE_PLUGINS_URL}/plugins/measurebar/measurebar.ol.min.css`} />
            <link rel="stylesheet" href={`${process.env.NEXT_PUBLIC_API_IDEE_PLUGINS_URL}/plugins/backimglayer/backimglayer.ol.min.css`} />
            <link rel="stylesheet" href={`${process.env.NEXT_PUBLIC_API_IDEE_PLUGINS_URL}/plugins/mousesrs/mousesrs.ol.min.css`} />
            <link rel="stylesheet" href={`${process.env.NEXT_PUBLIC_API_IDEE_PLUGINS_URL}/plugins/overviewmap/overviewmap.ol.min.css`} />
            <link rel="stylesheet" href={`${process.env.NEXT_PUBLIC_API_IDEE_PLUGINS_URL}/plugins/printviewmanagement/printviewmanagement.ol.min.css`} />
            <link rel="stylesheet" href={`${process.env.NEXT_PUBLIC_API_IDEE_PLUGINS_URL}/plugins/viewmanagement/viewmanagement.ol.min.css`} />
            <link rel="stylesheet" href={`${process.env.NEXT_PUBLIC_API_IDEE_PLUGINS_URL}/plugins/modal/modal.ol.min.css`} />
            <link rel="stylesheet" href={`${process.env.NEXT_PUBLIC_API_IDEE_PLUGINS_URL}/plugins/locator/locator.ol.min.css`} />
            <link rel="stylesheet" href={`${process.env.NEXT_PUBLIC_API_IDEE_PLUGINS_URL}/plugins/layerswitcher/layerswitcher.ol.min.css`} />
            {/* JS Assets */}
            {/* strategy="beforeInteractive" makes the project load the assets before rendering the front-end React App */}
            {/* API AND PLUGINS */}
            <Script src={`${process.env.NEXT_PUBLIC_API_IDEE_URL}/js/apiidee.ol.min.js`} strategy="beforeInteractive"></Script>
            <Script src={`${process.env.NEXT_PUBLIC_API_IDEE_URL}/js/configuration.js`} strategy="beforeInteractive"></Script>
            <Script src={`${process.env.NEXT_PUBLIC_API_IDEE_PLUGINS_URL}/plugins/measurebar/measurebar.ol.min.js`} strategy="beforeInteractive"></Script>
            <Script src={`${process.env.NEXT_PUBLIC_API_IDEE_PLUGINS_URL}/plugins/backimglayer/backimglayer.ol.min.js`} strategy="beforeInteractive"></Script>
            <Script src={`${process.env.NEXT_PUBLIC_API_IDEE_PLUGINS_URL}/plugins/mousesrs/mousesrs.ol.min.js`} strategy="beforeInteractive"></Script>
            <Script src={`${process.env.NEXT_PUBLIC_API_IDEE_PLUGINS_URL}/plugins/overviewmap/overviewmap.ol.min.js`} strategy="beforeInteractive"></Script>
            <Script src={`${process.env.NEXT_PUBLIC_API_IDEE_PLUGINS_URL}/plugins/printviewmanagement/printviewmanagement.ol.min.js`} strategy="beforeInteractive"></Script>
            <Script src={`${process.env.NEXT_PUBLIC_API_IDEE_PLUGINS_URL}/plugins/viewmanagement/viewmanagement.ol.min.js`} strategy="beforeInteractive"></Script>
            <Script src={`${process.env.NEXT_PUBLIC_API_IDEE_PLUGINS_URL}/plugins/modal/modal.ol.min.js`} strategy="beforeInteractive"></Script>
            <Script src={`${process.env.NEXT_PUBLIC_API_IDEE_PLUGINS_URL}/plugins/locator/locator.ol.min.js`} strategy="beforeInteractive"></Script>
            <Script src={`${process.env.NEXT_PUBLIC_API_IDEE_PLUGINS_URL}/plugins/layerswitcher/layerswitcher.ol.min.js`} strategy="beforeInteractive"></Script>
        
            {/* ANALYTICS ADDED IN THE LAYOUT COMPONENT */}
            <script async src="https://www.googletagmanager.com/gtag/js?id=G-BD9Y711CH9"></script>
            <Script id="google-analytics" strategy="afterInteractive" dangerouslySetInnerHTML={{
                __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());

                gtag('config', '${process.env.GOOGLE_ANALYTICS_ID}');
                `}}>
            </Script>
        </>
    )
}