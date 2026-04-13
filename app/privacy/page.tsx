import { Metadata } from "next";
import RidgelineFooter from "@/components/ridgeline/footer";

export const metadata: Metadata = {
  title: "Privacy Policy — RuufPro",
  description: "Privacy Policy for RuufPro, operated by FEEDBACK FOOTPRINT LLC.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0F2A37]">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="mx-auto max-w-[1440px] px-6 py-4 md:px-10 flex items-center justify-between">
          <a href="/" className="flex items-center gap-1">
            <div className="bg-white text-[#1B3A4B] font-black tracking-tight text-[10px] px-2.5 py-1 rounded-xl rounded-bl-sm relative">
              RUUF
              <div className="absolute -bottom-1 left-0 w-2.5 h-2.5 bg-white" style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}></div>
            </div>
            <div className="bg-[#D4863E] text-white font-black text-[10px] px-2.5 py-1 rounded-full border border-white/20">
              PRO
            </div>
          </a>
          <a href="/" className="text-xs text-white/40 hover:text-white/70 transition-colors">
            &larr; Back to Home
          </a>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 py-16 md:px-10 md:py-24">
        <h1 className="font-[family-name:var(--font-sora)] text-3xl md:text-4xl font-bold text-white mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-white/40 mb-12">Last updated April 13, 2026</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-white/70 leading-relaxed [&_h2]:font-[family-name:var(--font-sora)] [&_h2]:text-white [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-12 [&_h2]:mb-4 [&_h3]:text-white/90 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-8 [&_h3]:mb-3 [&_a]:text-[#D4863E] [&_a]:underline [&_ul]:space-y-1 [&_ul]:ml-4 [&_li]:text-white/60">

          <p>
            This Privacy Notice for FEEDBACK FOOTPRINT LLC (doing business as RuufPro) (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), describes how and why we might access, collect, store, use, and/or share (&quot;process&quot;) your personal information when you use our services (&quot;Services&quot;), including when you:
          </p>
          <ul>
            <li>Visit our website at ruufpro.com, or any website of ours that links to this Privacy Notice</li>
            <li>Use RuufPro. RuufPro is a software-as-a-service (SaaS) platform that provides roofing contractors with professional websites, instant roofing estimate tools, AI-powered chatbot assistants, lead management, and automated customer communication features. Homeowners can receive instant roof replacement estimates by entering their property address on a contractor&apos;s RuufPro-powered website, and interact with an AI chatbot (Riley) that answers questions about services, pricing, and availability. Contractors use the RuufPro dashboard to manage leads, configure pricing, send estimates, and communicate with customers via email.</li>
            <li>Engage with us in other related ways, including any marketing or events</li>
          </ul>
          <p>
            <strong className="text-white">Questions or concerns?</strong> Reading this Privacy Notice will help you understand your privacy rights and choices. We are responsible for making decisions about how your personal information is processed. If you do not agree with our policies and practices, please do not use our Services. If you still have any questions or concerns, please contact us at{" "}
            <a href="mailto:privacy@ruufpro.com">privacy@ruufpro.com</a>.
          </p>

          <h2>Summary of Key Points</h2>
          <p><em>This summary provides key points from our Privacy Notice, but you can find out more details about any of these topics by reading the full sections below.</em></p>
          <ul>
            <li><strong className="text-white/90">What personal information do we process?</strong> When you visit, use, or navigate our Services, we may process personal information depending on how you interact with us and the Services, the choices you make, and the products and features you use.</li>
            <li><strong className="text-white/90">Do we process any sensitive personal information?</strong> We do not process sensitive personal information.</li>
            <li><strong className="text-white/90">Do we collect any information from third parties?</strong> We may collect limited data from public databases and other outside sources.</li>
            <li><strong className="text-white/90">How do we process your information?</strong> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law.</li>
            <li><strong className="text-white/90">In what situations and with which parties do we share personal information?</strong> We may share information in specific situations and with specific third parties.</li>
            <li><strong className="text-white/90">How do we keep your information safe?</strong> We have adequate organizational and technical processes and procedures in place to protect your personal information. However, no electronic transmission over the internet or information storage technology can be guaranteed to be 100% secure.</li>
            <li><strong className="text-white/90">What are your rights?</strong> Depending on where you are located geographically, the applicable privacy law may mean you have certain rights regarding your personal information.</li>
            <li><strong className="text-white/90">How do you exercise your rights?</strong> The easiest way to exercise your rights is by submitting a data subject access request, or by contacting us at privacy@ruufpro.com.</li>
          </ul>

          <h2>1. What Information Do We Collect?</h2>

          <h3>Personal information you disclose to us</h3>
          <p><em><strong className="text-white/90">In Short:</strong> We collect personal information that you provide to us.</em></p>
          <p>
            We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.
          </p>
          <p><strong className="text-white/90">Personal Information Provided by You.</strong> The personal information that we collect depends on the context of your interactions with us and the Services, the choices you make, and the products and features you use. The personal information we collect may include the following:</p>
          <ul>
            <li>Names</li>
            <li>Phone numbers</li>
            <li>Email addresses</li>
            <li>Mailing addresses</li>
            <li>Passwords</li>
            <li>Contact preferences</li>
            <li>Billing addresses</li>
          </ul>
          <p><strong className="text-white/90">Sensitive Information.</strong> We do not process sensitive information.</p>
          <p>
            <strong className="text-white/90">Payment Data.</strong> We may collect data necessary to process your payment if you choose to make purchases, such as your payment instrument number, and the security code associated with your payment instrument. All payment data is handled and stored by{" "}
            <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">Stripe</a>.
            You may find their privacy notice at{" "}
            <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">https://stripe.com/privacy</a>.
          </p>
          <p>All personal information that you provide to us must be true, complete, and accurate, and you must notify us of any changes to such personal information.</p>

          <h3>Information automatically collected</h3>
          <p><em><strong className="text-white/90">In Short:</strong> Some information — such as your Internet Protocol (IP) address and/or browser and device characteristics — is collected automatically when you visit our Services.</em></p>
          <p>
            We automatically collect certain information when you visit, use, or navigate the Services. This information does not reveal your specific identity (like your name or contact information) but may include device and usage information, such as your IP address, browser and device characteristics, operating system, language preferences, referring URLs, device name, country, location, information about how and when you use our Services, and other technical information. This information is primarily needed to maintain the security and operation of our Services, and for our internal analytics and reporting purposes.
          </p>
          <p>Like many businesses, we also collect information through cookies and similar technologies.</p>
          <p>The information we collect includes:</p>
          <ul>
            <li><em>Log and Usage Data.</em> Log and usage data is service-related, diagnostic, usage, and performance information our servers automatically collect when you access or use our Services and which we record in log files. This log data may include your IP address, device information, browser type, and settings and information about your activity in the Services (such as the date/time stamps associated with your usage, pages and files viewed, searches, and other actions you take such as which features you use), device event information (such as system activity, error reports, and hardware settings).</li>
            <li><em>Device Data.</em> We collect device data such as information about your computer, phone, tablet, or other device you use to access the Services. Depending on the device used, this device data may include information such as your IP address (or proxy server), device and application identification numbers, location, browser type, hardware model, Internet service provider and/or mobile carrier, operating system, and system configuration information.</li>
            <li><em>Location Data.</em> We collect location data such as information about your device&apos;s location, which can be either precise or imprecise. How much information we collect depends on the type and settings of the device you use to access the Services. For example, we may use GPS and other technologies to collect geolocation data that tells us your current location (based on your IP address). You can opt out of allowing us to collect this information either by refusing access to the information or by disabling your Location setting on your device. However, if you choose to opt out, you may not be able to use certain aspects of the Services.</li>
          </ul>

          <h3>Google API</h3>
          <p>
            Our use of information received from Google APIs will adhere to the{" "}
            <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">Google API Services User Data Policy</a>, including the{" "}
            <a href="https://developers.google.com/terms/api-services-user-data-policy#limited-use" target="_blank" rel="noopener noreferrer">Limited Use requirements</a>.
          </p>

          <h3>Information collected from other sources</h3>
          <p><em><strong className="text-white/90">In Short:</strong> We may collect limited data from public databases and other outside sources.</em></p>
          <p>
            In order to enhance our ability to provide relevant marketing, offers, and services to you and update our records, we may obtain information about you from other sources, such as public databases, joint marketing partners, affiliate programs, data providers, social media platforms, and from other third parties. This information includes property data such as year built, square footage, home value, owner information, roof type, sale history, and tax data obtained from property data providers for the purpose of generating roofing estimates and enriching lead information for contractors.
          </p>

          <h2>2. How Do We Process Your Information?</h2>
          <p><em><strong className="text-white/90">In Short:</strong> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent.</em></p>
          <p>We process your personal information for a variety of reasons, depending on how you interact with our Services, including:</p>
          <ul>
            <li>To deliver and facilitate delivery of services to users</li>
            <li>To respond to user inquiries/offer support to users</li>
            <li>To send administrative information to users</li>
            <li>To fulfill and manage user orders</li>
            <li>To enable user-to-user communications</li>
            <li>To request feedback</li>
            <li>To send users marketing and promotional communications</li>
            <li>To protect our Services</li>
            <li>To identify usage trends</li>
            <li>To evaluate and improve our Services, products, marketing, and user experience</li>
            <li>To comply with our legal obligations</li>
            <li>To generate and deliver roofing estimates and interactive proposals based on user-provided property addresses</li>
          </ul>

          <h2>3. When and With Whom Do We Share Your Personal Information?</h2>
          <p><em><strong className="text-white/90">In Short:</strong> We may share information in specific situations described in this section and/or with the following third parties.</em></p>
          <p>We may need to share your personal information in the following situations:</p>
          <ul>
            <li><strong className="text-white/90">With service providers.</strong> We may share your information with third-party service providers who perform services for us, including payment processing (Stripe), email delivery (Resend), SMS messaging (Twilio), website hosting (Vercel), database services (Supabase), property data analysis (Google Solar API, Google Maps Platform, RentCast), and AI-based predictive analytics (Google Cloud AI).</li>
            <li><strong className="text-white/90">Between contractors and homeowners.</strong> When a homeowner submits information through a contractor&apos;s estimate widget, that information is shared with the specific contractor for the purpose of providing roofing services.</li>
            <li><strong className="text-white/90">Business transfers.</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.</li>
          </ul>

          <h2>4. Do We Use Cookies and Other Tracking Technologies?</h2>
          <p><em><strong className="text-white/90">In Short:</strong> We may use cookies and other tracking technologies to collect and store your information.</em></p>
          <p>
            We may use cookies and similar tracking technologies (like web beacons and pixels) to gather information when you interact with our Services. Some online tracking technologies help us maintain the security of our Services and your account, prevent crashes, fix bugs, save your preferences, and assist with basic site functions.
          </p>
          <p>
            We also permit third parties and service providers to use online tracking technologies on our Services for analytics and advertising, including to help manage and display advertisements, to tailor advertisements to your interests, or to send abandoned shopping cart reminders (depending on your communication preferences). The third parties and service providers use their technology to provide advertising about products and services tailored to your interests which may appear either on our Services or on other websites.
          </p>
          <p>
            Specific information about how we use such technologies and how you can refuse certain cookies is set out in our Cookie Policy.
          </p>
          <p><strong className="text-white/90">Google Maps Platform APIs.</strong> We may use certain Google Maps Platform APIs (such as the Google Maps API, Places API). To find out more about Google&apos;s Privacy Policy, please refer to{" "}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google&apos;s Privacy Policy</a>.
          </p>

          <h2>5. Do We Offer Artificial Intelligence-Based Products?</h2>
          <p><em><strong className="text-white/90">In Short:</strong> We offer products, features, or tools powered by artificial intelligence, machine learning, or similar technologies.</em></p>
          <p>
            As part of our Services, we offer products, features, or tools powered by artificial intelligence, machine learning, or similar technologies (collectively, &quot;AI Products&quot;). These tools are designed to enhance your experience and provide you with innovative solutions. The terms in this Privacy Notice govern your use of the AI Products within our Services.
          </p>
          <p><strong className="text-white/90">Use of AI Technologies.</strong> We provide AI Products through third-party service providers (&quot;AI Service Providers&quot;), including Google Cloud AI and Anthropic. The AI Products are used for the following functions:</p>
          <ul>
            <li>AI predictive analytics — generating roofing cost estimates based on satellite imagery and property data</li>
            <li>AI insights — analyzing roof measurements, materials, and conditions from satellite and property data sources</li>
            <li>AI chatbot (Riley) — answering homeowner questions about a contractor&apos;s services, pricing, and availability using information provided by the contractor. Chat conversations are stored to improve service quality and provide lead context to contractors.</li>
          </ul>
          <p><strong className="text-white/90">How We Process Your Data Using AI.</strong> All personal information processed using our AI Products is handled in line with our Privacy Notice and our agreement with third parties. This ensures high security and safeguards your personal information throughout the process, giving you peace of mind about your data&apos;s safety.</p>

          <h2>6. How Long Do We Keep Your Information?</h2>
          <p><em><strong className="text-white/90">In Short:</strong> We keep your information for as long as necessary to fulfill the purposes outlined in this Privacy Notice unless otherwise required by law.</em></p>
          <p>
            We will only keep your personal information for as long as it is necessary for the purposes set out in this Privacy Notice, unless a longer retention period is required or permitted by law (such as tax, accounting, or other legal requirements). No purpose in this notice will require us keeping your personal information for longer than the period of time in which users have an account with us.
          </p>
          <p>
            When we have no ongoing legitimate business need to process your personal information, we will either delete or anonymize such information, or, if this is not possible (for example, because your personal information has been stored in backup archives), then we will securely store your personal information and isolate it from any further processing until deletion is possible.
          </p>
          <p>
            Homeowner data submitted through a contractor&apos;s estimate widget is retained for as long as the associated contractor maintains an active account with our Services.
          </p>

          <h2>7. How Do We Keep Your Information Safe?</h2>
          <p><em><strong className="text-white/90">In Short:</strong> We aim to protect your personal information through a system of organizational and technical security measures.</em></p>
          <p>
            We have implemented appropriate and reasonable technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorized third parties will not be able to defeat our security and improperly collect, access, steal, or modify your information. Although we will do our best to protect your personal information, transmission of personal information to and from our Services is at your own risk. You should only access the Services within a secure environment.
          </p>

          <h2>8. Do We Collect Information from Minors?</h2>
          <p><em><strong className="text-white/90">In Short:</strong> We do not knowingly collect data from or market to children under 18 years of age.</em></p>
          <p>
            We do not knowingly collect, solicit data from, or market to children under 18 years of age, nor do we knowingly sell such personal information. By using the Services, you represent that you are at least 18 or that you are the parent or guardian of such a minor and consent to such minor dependent&apos;s use of the Services. If we learn that personal information from users less than 18 years of age has been collected, we will deactivate the account and take reasonable measures to promptly delete such data from our records. If you become aware of any data we may have collected from children under age 18, please contact us at{" "}
            <a href="mailto:privacy@ruufpro.com">privacy@ruufpro.com</a>.
          </p>

          <h2>9. What Are Your Privacy Rights?</h2>
          <p><em><strong className="text-white/90">In Short:</strong> You may review, change, or terminate your account at any time, depending on your country, province, or state of residence.</em></p>
          <p><strong className="text-white/90">Withdrawing your consent.</strong> If we are relying on your consent to process your personal information, which may be express and/or implied consent depending on the applicable law, you have the right to withdraw your consent at any time. You can withdraw your consent at any time by contacting us at privacy@ruufpro.com.</p>
          <p><strong className="text-white/90">Account Information.</strong> If you would at any time like to review or change the information in your account or terminate your account, you can:</p>
          <ul>
            <li>Log in to your account settings and update your user account.</li>
            <li>Contact us using the contact information provided.</li>
          </ul>
          <p>
            Upon your request to terminate your account, we will deactivate or delete your account and information from our active databases. However, we may retain some information in our files to prevent fraud, troubleshoot problems, assist with any investigations, enforce our legal terms and/or comply with applicable legal requirements.
          </p>
          <p><strong className="text-white/90">Opting out of marketing and promotional communications.</strong> You can unsubscribe from our marketing and promotional communications at any time by:</p>
          <ul>
            <li>Clicking the unsubscribe link at the bottom of our marketing emails</li>
            <li>Texting &quot;STOP&quot; or &quot;UNSUBSCRIBE&quot; in response to our SMS messages</li>
          </ul>
          <p>You will then be removed from the marketing lists. However, we may still communicate with you — for example, to send you service-related messages that are necessary for the administration and use of your account, to respond to service requests, or for other non-marketing purposes.</p>

          <h2>10. Controls for Do-Not-Track Features</h2>
          <p>
            Most web browsers and some mobile operating systems and mobile applications include a Do-Not-Track (&quot;DNT&quot;) feature or setting you can activate to signal your privacy preference not to have data about your online browsing activities monitored and collected. At this stage, no uniform technology standard for recognizing and implementing DNT signals has been finalized. As such, we do not currently respond to DNT browser signals or any other mechanism that automatically communicates your choice not to be tracked online. If a standard for online tracking is adopted that we must follow in the future, we will inform you about that practice in a revised version of this Privacy Notice.
          </p>

          <h2>11. Do United States Residents Have Specific Privacy Rights?</h2>
          <p><em><strong className="text-white/90">In Short:</strong> If you are a resident of certain US states, you may have additional rights regarding your personal information.</em></p>

          <h3>Categories of personal information we collect</h3>
          <p>We have collected the following categories of personal information in the past twelve (12) months:</p>

          <div className="overflow-x-auto my-6">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-3 pr-4 text-white/90 font-semibold">Category</th>
                  <th className="text-left py-3 pr-4 text-white/90 font-semibold">Examples</th>
                  <th className="text-left py-3 text-white/90 font-semibold">Collected</th>
                </tr>
              </thead>
              <tbody className="text-white/60">
                <tr className="border-b border-white/10">
                  <td className="py-3 pr-4">A. Identifiers</td>
                  <td className="py-3 pr-4">Contact details (name, email, phone, address)</td>
                  <td className="py-3">YES</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 pr-4">B. Personal information (CA Customer Records)</td>
                  <td className="py-3 pr-4">Name, address, telephone number, signature</td>
                  <td className="py-3">YES</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 pr-4">C. Protected classification characteristics</td>
                  <td className="py-3 pr-4">Gender, age, race, etc.</td>
                  <td className="py-3">NO</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 pr-4">D. Commercial information</td>
                  <td className="py-3 pr-4">Purchasing history, estimate selections</td>
                  <td className="py-3">YES</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 pr-4">E. Biometric information</td>
                  <td className="py-3 pr-4">Fingerprints, facial recognition</td>
                  <td className="py-3">NO</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 pr-4">F. Internet or network activity</td>
                  <td className="py-3 pr-4">Browsing history, search history, device info</td>
                  <td className="py-3">YES</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 pr-4">G. Geolocation data</td>
                  <td className="py-3 pr-4">Device location, property addresses</td>
                  <td className="py-3">YES</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 pr-4">H. Sensory data</td>
                  <td className="py-3 pr-4">Audio, visual, thermal recordings</td>
                  <td className="py-3">NO</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 pr-4">I. Professional or employment data</td>
                  <td className="py-3 pr-4">Business information, services offered, licensing</td>
                  <td className="py-3">YES</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 pr-4">J. Education information</td>
                  <td className="py-3 pr-4">Student records</td>
                  <td className="py-3">NO</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 pr-4">K. Inferences from collected data</td>
                  <td className="py-3 pr-4">User profiles or preferences</td>
                  <td className="py-3">NO</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-3 pr-4">L. Sensitive personal information</td>
                  <td className="py-3 pr-4">Financial accounts, precise geolocation, etc.</td>
                  <td className="py-3">NO</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>We may also collect other personal information outside of these categories through instances where you interact with us in person, online, or by phone or mail in the context of receiving help through our customer support channels, participation in customer surveys or contests, and facilitation in the delivery of our Services and to respond to your inquiries.</p>

          <h3>Your rights</h3>
          <p>Depending on the state where you live, you may have the following rights:</p>
          <ul>
            <li>Right to know whether or not we are processing your personal data</li>
            <li>Right to access your personal data</li>
            <li>Right to correct inaccuracies in your personal data</li>
            <li>Right to request the deletion of your personal data</li>
            <li>Right to obtain a copy of the personal data you previously shared with us</li>
            <li>Right to non-discrimination for exercising your rights</li>
            <li>Right to opt out of the processing of your personal data if it is used for targeted advertising, the sale of personal data, or profiling</li>
          </ul>

          <h3>How to exercise your rights</h3>
          <p>
            To exercise these rights, you can contact us by visiting{" "}
            <a href="mailto:privacy@ruufpro.com">privacy@ruufpro.com</a>, or by referring to the contact details at the bottom of this document.
          </p>
          <p>
            Under certain US state data protection laws, you can designate an authorized agent to make a request on your behalf. We may deny a request from an authorized agent that does not submit proof that they have been validly authorized to act on your behalf in accordance with applicable laws.
          </p>

          <h3>Request verification</h3>
          <p>
            Upon receiving your request, we will need to verify your identity to determine you are the same person about whom we have the information in our system. These verification efforts require us to ask you to provide information so that we can match it with information you have previously provided us. We will only use personal information provided in your request to verify your identity or authority to make the request.
          </p>

          <h3>Appeals</h3>
          <p>
            Under certain US state data protection laws, if we decline to take action regarding your request, you may appeal our decision by emailing us at{" "}
            <a href="mailto:privacy@ruufpro.com">privacy@ruufpro.com</a>. We will inform you in writing of any action taken or not taken in response to the appeal, including a written explanation of the reasons for the decisions. If your appeal is denied, you may contact your state attorney general to submit a complaint.
          </p>

          <h3>California &quot;Shine the Light&quot; law</h3>
          <p>
            California Civil Code Section 1798.83, also known as the &quot;Shine The Light&quot; law, permits our users who are California residents to request and obtain from us, once a year and free of charge, information about categories of personal information (if any) we disclosed to third parties for direct marketing purposes and the names and addresses of all third parties with which we shared personal information in the immediately preceding calendar year. If you are a California resident and would like to make such a request, please submit your request in writing to us using the contact information provided below.
          </p>

          <h2>12. Roofing Estimates, Property Data, and Electronic Signatures</h2>
          <p>
            Our platform generates roofing cost estimates based on property data obtained from third-party sources, including satellite imagery and public property records. These estimates are approximate and are provided for informational purposes only. They do not constitute a binding offer, quote, or guarantee of final cost. Actual roofing costs may vary based on factors including but not limited to roof condition, material availability, contractor pricing, and local market conditions.
          </p>
          <p>
            Homeowner data submitted through a contractor&apos;s estimate widget is shared with that specific contractor for the purpose of providing roofing services.
          </p>
          <p>
            Electronic signatures collected through our interactive proposal feature are governed by the Electronic Signatures in Global and National Commerce Act (ESIGN Act) and the Uniform Electronic Transactions Act (UETA). When a homeowner signs an estimate, we record the signer&apos;s name, email address, IP address, timestamp, and a frozen snapshot of the estimate at the time of signing for legal compliance purposes.
          </p>

          <h2>13. Do We Make Updates to This Notice?</h2>
          <p><em><strong className="text-white/90">In Short:</strong> Yes, we will update this notice as necessary to stay compliant with relevant laws.</em></p>
          <p>
            We may update this Privacy Notice from time to time. The updated version will be indicated by an updated &quot;Last updated&quot; date at the top of this Privacy Notice. If we make material changes to this Privacy Notice, we may notify you either by prominently posting a notice of such changes or by directly sending you a notification. We encourage you to review this Privacy Notice frequently to be informed of how we are protecting your information.
          </p>

          <h2>14. How Can You Contact Us About This Notice?</h2>
          <p>If you have questions or comments about this notice, you may email us at{" "}
            <a href="mailto:privacy@ruufpro.com">privacy@ruufpro.com</a> or contact us by post at:
          </p>
          <p>
            FEEDBACK FOOTPRINT LLC<br />
            d/b/a RuufPro<br />
            8734 54th Ave E<br />
            Bradenton, FL 34211<br />
            United States
          </p>

          <h2>15. How Can You Review, Update, or Delete the Data We Collect from You?</h2>
          <p>
            Based on the applicable laws of your country or state of residence in the US, you may have the right to request access to the personal information we collect from you, details about how we have processed it, correct inaccuracies, or delete your personal information. You may also have the right to withdraw your consent to our processing of your personal information. To request to review, update, or delete your personal information, please contact us at{" "}
            <a href="mailto:privacy@ruufpro.com">privacy@ruufpro.com</a>.
          </p>

        </div>
      </main>

      <RidgelineFooter />
    </div>
  );
}
