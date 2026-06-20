'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const PRIVACY_HTML = `
<style>
  [data-custom-class='body'], [data-custom-class='body'] * {
    background: transparent !important;
  }
  [data-custom-class='title'], [data-custom-class='title'] * {
    font-family: Arial !important;
    font-size: 26px !important;
    color: #000000 !important;
  }
  [data-custom-class='subtitle'], [data-custom-class='subtitle'] * {
    font-family: Arial !important;
    color: #595959 !important;
    font-size: 14px !important;
  }
  [data-custom-class='heading_1'], [data-custom-class='heading_1'] * {
    font-family: Arial !important;
    font-size: 19px !important;
    color: #000000 !important;
  }
  [data-custom-class='heading_2'], [data-custom-class='heading_2'] * {
    font-family: Arial !important;
    font-size: 17px !important;
    color: #000000 !important;
  }
  [data-custom-class='body_text'], [data-custom-class='body_text'] * {
    color: #595959 !important;
    font-size: 14px !important;
    font-family: Arial !important;
  }
  [data-custom-class='link'], [data-custom-class='link'] * {
    color: #3030F1 !important;
    font-size: 14px !important;
    font-family: Arial !important;
    word-break: break-word !important;
  }
  ul {
    list-style-type: square;
    margin-left: 20px;
    margin-bottom: 10px;
  }
  ul > li > ul {
    list-style-type: circle;
  }
  ul > li > ul > li > ul {
    list-style-type: square;
  }
  ol li {
    font-family: Arial ;
  }
</style>

<span style="display: block; margin: 0 auto 3.125rem; width: 11.125rem; height: 3.5rem; background: url(/trubill-logo.png) center no-repeat; background-size: contain;"></span>

<div data-custom-class="body">
  <div><strong><span style="font-size: 26px;"><span data-custom-class="title"><h1>PRIVACY POLICY</h1></span></span></strong></div>
  <div><span style="color: rgb(127, 127, 127);"><strong><span style="font-size: 15px;"><span data-custom-class="subtitle">Last updated June 20, 2026</span></span></strong></span></div>
  <div><br></div>
  <div><br></div>
  <div><br></div>
  <div style="line-height: 1.5;">
    <span style="color: rgb(127, 127, 127);">
      <span style="color: rgb(89, 89, 89); font-size: 15px;">
        <span data-custom-class="body_text">This Privacy Notice for TruBill Invoice (doing business as TruBill Invoice) ("<strong>we</strong>," "<strong>us</strong>," or "<strong>our</strong>"), describes how and why we might access, collect, store, use, and/or share ("<strong>process</strong>") your personal information when you use our services ("<strong>Services</strong>"), including when you:</span>
      </span>
    </span>
  </div>
  <ul>
    <li data-custom-class="body_text" style="line-height: 1.5;">
      <span style="font-size: 15px; color: rgb(89, 89, 89);">
        <span data-custom-class="body_text">Visit our website at <span style="color: rgb(0, 58, 250);"><a target="_blank" data-custom-class="link" href="https://www.trubill.in">https://www.trubill.in</a></span> or any website of ours that links to this Privacy Notice</span>
      </span>
    </li>
  </ul>
  <ul>
    <li data-custom-class="body_text" style="line-height: 1.5;">
      <span style="font-size: 15px; color: rgb(89, 89, 89);">
        <span data-custom-class="body_text">Engage with us in other related ways, including any marketing or events</span>
      </span>
    </li>
  </ul>
  <div style="line-height: 1.5;">
    <span style="font-size: 15px; color: rgb(127, 127, 127);">
      <span data-custom-class="body_text"><strong>Questions or concerns? </strong>Reading this Privacy Notice will help you understand your privacy rights and choices. We are responsible for making decisions about how your personal information is processed. If you do not agree with our policies and practices, please do not use our Services. If you still have any questions or concerns, please contact us at <a target="_blank" data-custom-class="link" href="mailto:trubillapp@gmail.com">trubillapp@gmail.com</a>.</span>
    </span>
  </div>
  <div style="line-height: 1.5;"><br></div>
  <div style="line-height: 1.5;"><br></div>
  <div style="line-height: 1.5;"><strong><span style="font-size: 15px;"><span data-custom-class="heading_1"><h2>SUMMARY OF KEY POINTS</h2></span></span></strong></div>
  <div style="line-height: 1.5;">
    <span style="font-size: 15px;">
      <span data-custom-class="body_text"><strong><em>This summary provides key points from our Privacy Notice, but you can find out more details about any of these topics by clicking the link following each key point or by using our </em></strong></span>
    </span>
    <a data-custom-class="link" href="#toc"><span style="color: rgb(0, 58, 250); font-size: 15px;"><span data-custom-class="body_text"><strong><em>table of contents</em></strong></span></span></a>
    <span style="font-size: 15px;">
      <span data-custom-class="body_text"><strong><em> below to find the section you are looking for.</em></strong></span>
    </span>
  </div>
  <div style="line-height: 1.5;"><br></div>
  <div style="line-height: 1.5;">
    <span style="font-size: 15px;">
      <span data-custom-class="body_text"><strong>What personal information do we process?</strong> When you visit, use, or navigate our Services, we may process personal information depending on how you interact with us and the Services, the choices you make, and the products and features you use. Learn more about </span>
    </span>
    <a data-custom-class="link" href="#personalinfo"><span style="color: rgb(0, 58, 250); font-size: 15px;"><span data-custom-class="body_text">personal information you disclose to us</span></span></a>.
  </div>
  <div style="line-height: 1.5;"><br></div>
  <div style="line-height: 1.5;">
    <span style="font-size: 15px;">
      <span data-custom-class="body_text"><strong>Do we process any sensitive personal information? </strong>Some of the information may be considered "special" or "sensitive" in certain jurisdictions, for example your racial or ethnic origins, sexual orientation, and religious beliefs. We may process sensitive personal information when necessary with your consent or as otherwise permitted by applicable law. Learn more about </span>
    </span>
    <a data-custom-class="link" href="#sensitiveinfo"><span style="color: rgb(0, 58, 250); font-size: 15px;"><span data-custom-class="body_text">sensitive information we process</span></span></a>.
  </div>
  <div style="line-height: 1.5;"><br></div>
  <div style="line-height: 1.5;">
    <span style="font-size: 15px;">
      <span data-custom-class="body_text"><strong>Do we collect any information from third parties?</strong> We do not collect any information from third parties.</span>
    </span>
  </div>
  <div style="line-height: 1.5;"><br></div>
  <div style="line-height: 1.5;">
    <span style="font-size: 15px;">
      <span data-custom-class="body_text"><strong>How do we process your information?</strong> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent. We process your information only when we have a valid legal reason to do so. Learn more about </span>
    </span>
    <a data-custom-class="link" href="#infouse"><span style="color: rgb(0, 58, 250); font-size: 15px;"><span data-custom-class="body_text">how we process your information</span></span></a>.
  </div>
  <div style="line-height: 1.5;"><br></div>
  <div style="line-height: 1.5;">
    <span style="font-size: 15px;">
      <span data-custom-class="body_text"><strong>In what situations and with which parties do we share personal information?</strong> We may share information in specific situations and with specific third parties. Learn more about </span>
    </span>
    <a data-custom-class="link" href="#whoshare"><span style="color: rgb(0, 58, 250); font-size: 15px;"><span data-custom-class="body_text">when and with whom we share your personal information</span></span></a>.
  </div>
  <div style="line-height: 1.5;"><br></div>
  <div style="line-height: 1.5;">
    <span style="font-size: 15px;">
      <span data-custom-class="body_text"><strong>How do we keep your information safe?</strong> We have adequate organizational and technical processes and procedures in place to protect your personal information. However, no electronic transmission over the internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorized third parties will not be able to defeat our security and improperly collect, access, steal, or modify your information. Learn more about </span>
    </span>
    <a data-custom-class="link" href="#infosafe"><span style="color: rgb(0, 58, 250); font-size: 15px;"><span data-custom-class="body_text">how we keep your information safe</span></span></a>.
  </div>
  <div style="line-height: 1.5;"><br></div>
  <div style="line-height: 1.5;">
    <span style="font-size: 15px;">
      <span data-custom-class="body_text"><strong>What are your rights?</strong> Depending on where you are located geographically, the applicable privacy law may mean you have certain rights regarding your personal information. Learn more about </span>
    </span>
    <a data-custom-class="link" href="#privacyrights"><span style="color: rgb(0, 58, 250); font-size: 15px;"><span data-custom-class="body_text">your privacy rights</span></span></a>.
  </div>
  <div style="line-height: 1.5;"><br></div>
  <div style="line-height: 1.5;">
    <span style="font-size: 15px;">
      <span data-custom-class="body_text"><strong>How do you exercise your rights?</strong> The easiest way to exercise your rights is by submitting a </span>
    </span>
    <a data-custom-class="link" href="https://app.termly.io/dsar/29352c0c-25b3-4799-a507-d425b159bd02" rel="noopener noreferrer" target="_blank"><span style="color: rgb(0, 58, 250); font-size: 15px;"><span data-custom-class="body_text">data subject access request</span></span></a>, or by contacting us. We will consider and act upon any request in accordance with applicable data protection laws.
  </div>
  <div style="line-height: 1.5;"><br></div>
  <div style="line-height: 1.5;">
    <span style="font-size: 15px;">
      <span data-custom-class="body_text">Want to learn more about what we do with any information we collect? </span>
    </span>
    <a data-custom-class="link" href="#toc"><span style="color: rgb(0, 58, 250); font-size: 15px;"><span data-custom-class="body_text">Review the Privacy Notice in full</span></span></a>.
  </div>
  <div style="line-height: 1.5;"><br></div>
  <div style="line-height: 1.5;"><br></div>
  <div id="toc" style="line-height: 1.5;">
    <span style="font-size: 15px;">
      <span style="color: rgb(0, 0, 0);"><strong><span data-custom-class="heading_1"><h2>TABLE OF CONTENTS</h2></span></strong></span>
    </span>
  </div>
  <div style="line-height: 1.5;"><span style="font-size: 15px;"><a data-custom-class="link" href="#infocollect"><span style="color: rgb(0, 58, 250);">1. WHAT INFORMATION DO WE COLLECT?</span></a></span></div>
  <div style="line-height: 1.5;"><span style="font-size: 15px;"><a data-custom-class="link" href="#infouse"><span style="color: rgb(0, 58, 250);">2. HOW DO WE PROCESS YOUR INFORMATION?</span></a></span></div>
  <div style="line-height: 1.5;"><span style="font-size: 15px;"><a data-custom-class="link" href="#whoshare"><span style="color: rgb(0, 58, 250);">3. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</span></a></span></div>
  <div style="line-height: 1.5;"><span style="font-size: 15px;"><a data-custom-class="link" href="#cookies"><span style="color: rgb(0, 58, 250);">4. DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?</span></a></span></div>
  <div style="line-height: 1.5;"><span style="font-size: 15px;"><a data-custom-class="link" href="#inforetain"><span style="color: rgb(0, 58, 250);">5. HOW LONG DO WE KEEP YOUR INFORMATION?</span></a></span></div>
  <div style="line-height: 1.5;"><span style="font-size: 15px;"><a data-custom-class="link" href="#infosafe"><span style="color: rgb(0, 58, 250);">6. HOW DO WE KEEP YOUR INFORMATION SAFE?</span></a></span></div>
  <div style="line-height: 1.5;"><span style="font-size: 15px;"><a data-custom-class="link" href="#infominors"><span style="color: rgb(0, 58, 250);">7. DO WE COLLECT INFORMATION FROM MINORS?</span></a></span></div>
  <div style="line-height: 1.5;"><span style="font-size: 15px;"><a data-custom-class="link" href="#privacyrights"><span style="color: rgb(0, 58, 250);">8. WHAT ARE YOUR PRIVACY RIGHTS?</span></a></span></div>
  <div style="line-height: 1.5;"><span style="font-size: 15px;"><a data-custom-class="link" href="#DNT"><span style="color: rgb(0, 58, 250);">9. CONTROLS FOR DO-NOT-TRACK FEATURES</span></a></span></div>
  <div style="line-height: 1.5;"><span style="font-size: 15px;"><a data-custom-class="link" href="#clausea"><span style="color: rgb(0, 58, 250);">10. GST DATA AND FILING DISCLAIMER</span></a></span></div>
  <div style="line-height: 1.5;"><span style="font-size: 15px;"><a data-custom-class="link" href="#policyupdates"><span style="color: rgb(0, 58, 250);">11. DO WE MAKE UPDATES TO THIS NOTICE?</span></a></span></div>
  <div style="line-height: 1.5;"><span style="font-size: 15px;"><a data-custom-class="link" href="#contact"><span style="color: rgb(0, 58, 250);">12. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</span></a></span></div>
  <div style="line-height: 1.5;"><span style="font-size: 15px;"><a data-custom-class="link" href="#request"><span style="color: rgb(0, 58, 250);">13. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</span></a></span></div>
  <div style="line-height: 1.5;"><br></div>
  <div style="line-height: 1.5;"><br></div>
  <div id="infocollect" style="line-height: 1.5;">
    <span style="color: rgb(0, 0, 0);">
      <strong><span data-custom-class="heading_1"><h2>1. WHAT INFORMATION DO WE COLLECT?</h2></span></strong>
    </span>
    <span data-custom-class="heading_2" id="personalinfo" style="color: rgb(0, 0, 0);">
      <span style="font-size: 15px;"><strong><h3>Personal information you disclose to us</h3></strong></span>
    </span>
    <span style="color: rgb(127, 127, 127);">
      <span style="color: rgb(89, 89, 89); font-size: 15px;">
        <span data-custom-class="body_text"><strong><em>In Short:</em></strong><em> We collect personal information that you provide to us.</em></span>
      </span>
    </span>
  </div>
  <div style="line-height: 1.5;"><br></div>
  <div style="line-height: 1.5;">
    <span style="font-size: 15px; color: rgb(89, 89, 89);">
      <span data-custom-class="body_text">We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services, or otherwise when you contact us.</span>
    </span>
  </div>
  <div style="line-height: 1.5;"><br></div>
  <div style="line-height: 1.5;">
    <span style="font-size: 15px; color: rgb(89, 89, 89);">
      <span data-custom-class="body_text"><strong>Personal Information Provided by You.</strong> The personal information that we collect depends on the context of your interactions with us and the Services, the choices you make, and the products and features you use. The personal information we collect may include the following:</span>
    </span>
  </div>
  <ul>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px; color: rgb(89, 89, 89);"><span data-custom-class="body_text">names</span></span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px; color: rgb(89, 89, 89);"><span data-custom-class="body_text">phone numbers</span></span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px; color: rgb(89, 89, 89);"><span data-custom-class="body_text">email addresses</span></span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px; color: rgb(89, 89, 89);"><span data-custom-class="body_text">mailing addresses</span></span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px; color: rgb(89, 89, 89);"><span data-custom-class="body_text">usernames</span></span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px; color: rgb(89, 89, 89);"><span data-custom-class="body_text">passwords</span></span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px; color: rgb(89, 89, 89);"><span data-custom-class="body_text">contact preferences</span></span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px; color: rgb(89, 89, 89);"><span data-custom-class="body_text">contact or authentication data</span></span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px; color: rgb(89, 89, 89);"><span data-custom-class="body_text">billing addresses</span></span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px; color: rgb(89, 89, 89);"><span data-custom-class="body_text">job titles</span></span></li>
  </ul>
  <div id="sensitiveinfo" style="line-height: 1.5;">
    <span style="font-size: 15px;">
      <span data-custom-class="body_text"><strong>Sensitive Information.</strong> When necessary, with your consent or as otherwise permitted by applicable law, we process the following categories of sensitive information:</span>
    </span>
  </div>
  <ul>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px;"><span data-custom-class="body_text">financial data</span></span></li>
  </ul>
  <div style="line-height: 1.5;">
    <span style="font-size: 15px; color: rgb(89, 89, 89);">
      <span data-custom-class="body_text">All personal information that you provide to us must be true, complete, and accurate, and you must notify us of any changes to such personal information.</span>
    </span>
  </div>
  <div style="line-height: 1.5;"><br></div>
  <div style="line-height: 1.5;">
    <span data-custom-class="heading_2" style="color: rgb(0, 0, 0);"><span style="font-size: 15px;"><strong><h3>Information automatically collected</h3></strong></span></span>
    <span style="color: rgb(127, 127, 127);">
      <span style="color: rgb(89, 89, 89); font-size: 15px;">
        <span data-custom-class="body_text"><strong><em>In Short:</em></strong><em> Some information — such as your Internet Protocol (IP) address and/or browser and device characteristics — is collected automatically when you visit our Services.</em></span>
      </span>
    </span>
  </div>
  <div style="line-height: 1.5;"><br></div>
  <div style="line-height: 1.5;">
    <span style="font-size: 15px; color: rgb(89, 89, 89);">
      <span data-custom-class="body_text">We automatically collect certain information when you visit, use, or navigate the Services. This information does not reveal your specific identity (like your name or contact information) but may include device and usage information, such as your IP address, browser and device characteristics, operating system, language preferences, referring URLs, device name, country, location, information about how and when you use our Services, and other technical information. This information is primarily needed to maintain the security and operation of our Services, and for our internal analytics and reporting purposes.</span>
    </span>
  </div>
  <div style="line-height: 1.5;"><br></div>
  <div style="line-height: 1.5;">
    <span style="font-size: 15px; color: rgb(89, 89, 89);">
      <span data-custom-class="body_text">Like many businesses, we also collect information through cookies and similar technologies. You can find out more about this in our Cookie Notice: <span style="color: rgb(0, 58, 250);"><a target="_blank" data-custom-class="link" href="https://trubill.in/privacy">https://trubill.in/privacy</a></span>.</span>
    </span>
  </div>
  <div style="line-height: 1.5;"><br></div>
  <div style="line-height: 1.5;">
    <span style="font-size: 15px; color: rgb(89, 89, 89);">
      <span data-custom-class="body_text">The information we collect includes:</span>
    </span>
  </div>
  <ul>
    <li data-custom-class="body_text" style="line-height: 1.5;">
      <span style="font-size: 15px; color: rgb(89, 89, 89);">
        <span data-custom-class="body_text"><em>Log and Usage Data.</em> Log and usage data is service-related, diagnostic, usage, and performance information our servers automatically collect when you access or use our Services and which we record in log files. Depending on how you interact with us, this log data may include your IP address, device information, browser type, and settings and information about your activity in the Services (such as the date/time stamps associated with your usage, pages and files viewed, searches, and other actions you take such as which features you use), device event information (such as system activity, error reports (sometimes called "crash dumps"), and hardware settings).</span>
      </span>
    </li>
  </ul>
  <div style="line-height: 1.5;"><br></div>
  <div id="infouse" style="line-height: 1.5;">
    <span style="color: rgb(127, 127, 127);">
      <span style="color: rgb(89, 89, 89); font-size: 15px;">
        <span id="control" style="color: rgb(0, 0, 0);"><strong><span data-custom-class="heading_1"><h2>2. HOW DO WE PROCESS YOUR INFORMATION?</h2></span></strong></span>
      </span>
    </span>
    <span style="color: rgb(127, 127, 127);">
      <span style="color: rgb(89, 89, 89); font-size: 15px;">
        <span data-custom-class="body_text"><strong><em>In Short: </em></strong><em>We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent.</em></span>
      </span>
    </span>
  </div>
  <div style="line-height: 1.5;"><br></div>
  <div style="line-height: 1.5;">
    <span style="font-size: 15px; color: rgb(89, 89, 89);">
      <span data-custom-class="body_text"><strong>We process your personal information for a variety of reasons, depending on how you interact with our Services, including:</strong></span>
    </span>
  </div>
  <ul>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px; color: rgb(89, 89, 89);"><span data-custom-class="body_text"><strong>To facilitate account creation and authentication and otherwise manage user accounts. </strong>We may process your information so you can create and log in to your account, as well as keep your account in working order.</span></span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px; color: rgb(89, 89, 89);"><span data-custom-class="body_text"><strong>To deliver and facilitate delivery of services to the user. </strong>We may process your information to provide you with the requested service.</span></span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px; color: rgb(89, 89, 89);"><span data-custom-class="body_text"><strong>To respond to user inquiries/offer support to users. </strong>We may process your information to respond to your inquiries and solve any potential issues you might have with the requested service.</span></span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px; color: rgb(89, 89, 89);"><span data-custom-class="body_text"><strong>To send administrative information to you. </strong>We may process your information to send you details about our products and services, changes to our terms and policies, and other similar information.</span></span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px; color: rgb(89, 89, 89);"><span data-custom-class="body_text"><strong>To fulfill and manage your orders. </strong>We may process your information to fulfill and manage your orders, payments, returns, and exchanges made through the Services.</span></span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px;"><span data-custom-class="body_text"><strong>To request feedback. </strong>We may process your information when necessary to request feedback and to contact you about your use of our Services.</span></span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px;"><span data-custom-class="body_text"><strong>To protect our Services.</strong> We may process your information as part of our efforts to keep our Services safe and secure, including fraud monitoring and prevention.</span></span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px;"><span data-custom-class="body_text"><strong>To evaluate and improve our Services, products, marketing, and your experience.</strong> We may process your information when we believe it is necessary to identify usage trends, determine the effectiveness of our promotional campaigns, and to evaluate and improve our Services, products, marketing, and your experience.</span></span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px;"><span data-custom-class="body_text"><strong>To comply with our legal obligations.</strong> We may process your information to comply with our legal obligations, respond to legal requests, and exercise, establish, or defend our legal rights.</span></span></li>
  </ul>
  <div style="line-height: 1.5;"><br></div>
  <div id="whoshare" style="line-height: 1.5;">
    <span style="color: rgb(127, 127, 127);">
      <span style="color: rgb(89, 89, 89); font-size: 15px;">
        <span id="control" style="color: rgb(0, 0, 0);"><strong><span data-custom-class="heading_1"><h2>3. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</h2></span></strong></span>
      </span>
    </span>
    <span style="font-size: 15px; color: rgb(89, 89, 89);">
      <span data-custom-class="body_text"><strong><em>In Short:</em></strong><em> We may share information in specific situations described in this section and/or with the following third parties.</em></span>
    </span>
  </div>
  <div style="line-height: 1.5;"><br></div>
  <div style="line-height: 1.5;">
    <span style="font-size: 15px;">
      <span data-custom-class="body_text"><strong>Vendors, Consultants, and Other Third-Party Service Providers.</strong> We may share your data with third-party vendors, service providers, contractors, or agents ("<strong>third parties</strong>") who perform services for us or on our behalf and require access to such information to do that work. We have contracts in place with our third parties, which are designed to help safeguard your personal information. This means that they cannot do anything with your personal information unless we have instructed them to do it. They will also not share your personal information with any organization apart from us. They also commit to protect the data they hold on our behalf and to retain it for the period we instruct. The third parties we may share personal information with are as follows:</span>
    </span>
  </div>
  <ul>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px; color: rgb(89, 89, 89);"><span data-custom-class="body_text"><strong>Functionality and Infrastructure Optimization: </strong>supabase</span></span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px; color: rgb(89, 89, 89);"><span data-custom-class="body_text"><strong>User Account Registration and Authentication: </strong>supabase</span></span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px; color: rgb(89, 89, 89);"><span data-custom-class="body_text"><strong>Website Hosting: </strong>vercel</span></span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px; color: rgb(89, 89, 89);"><span data-custom-class="body_text"><strong>Communicate & Chat with Users: </strong>Meta (WhatsApp Cloud API)</span></span></li>
  </ul>
  <div style="line-height: 1.5;">
    <span style="font-size: 15px;">
      <span data-custom-class="body_text">We also may need to share your personal information in the following situations:</span>
    </span>
  </div>
  <ul>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span style="font-size: 15px;"><span data-custom-class="body_text"><strong>Business Transfers.</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.</span></span></li>
  </ul>
  <div style="line-height: 1.5;"><br></div>
  <div id="cookies" style="line-height: 1.5;">
    <span style="color: rgb(127, 127, 127);">
      <span style="color: rgb(89, 89, 89); font-size: 15px;">
        <span id="control" style="color: rgb(0, 0, 0);"><strong><span data-custom-class="heading_1"><h2>4. DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?</h2></span></strong></span>
      </span>
    </span>
    <span style="font-size: 15px; color: rgb(89, 89, 89);">
      <span data-custom-class="body_text"><strong><em>In Short:</em></strong><em> We may use cookies and other tracking technologies to collect and store your information.</em></span>
    </span>
  </div>
  <div style="line-height: 1.5;"><br></div>
  <div style="line-height: 1.5;">
    <span style="font-size: 15px; color: rgb(89, 89, 89);">
      <span data-custom-class="body_text">We may use cookies and similar tracking technologies (like web beacons and pixels) to gather information when you interact with our Services. Some online tracking technologies help us maintain the security of our Services and your account, prevent crashes, fix bugs, save your preferences, and assist with basic site functions.</span>
    </span>
  </div>
  <div style="line-height: 1.5;"><br></div>
  <div style="line-height: 1.5;">
    <span style="font-size: 15px; color: rgb(89, 89, 89);">
      <span data-custom-class="body_text">We also permit third parties and service providers to use online tracking technologies on our Services for analytics and advertising, including to help manage and display advertisements, to tailor advertisements to your interests, or to send abandoned shopping cart reminders (depending on your communication preferences). The third parties and service providers use their technology to provide advertising about products and services tailored to your interests which may appear either on our Services or on other websites.</span>
    </span>
  </div>
  <div style="line-height: 1.5;"><br></div>
  <div style="line-height: 1.5;">
    <span style="font-size: 15px; color: rgb(89, 89, 89);">
      <span data-custom-class="body_text">Specific information about how we use such technologies and how you can refuse certain cookies is set out in our Cookie Notice: <span style="color: rgb(0, 58, 250);"><a target="_blank" data-custom-class="link" href="https://trubill.in/privacy">https://trubill.in/privacy</a></span>.</span>
    </span>
  </div>
  <div style="line-height: 1.5;"><br></div>
  <div id="inforetain" style="line-height: 1.5;">
    <span style="color: rgb(127, 127, 127);">
      <span style="color: rgb(89, 89, 89); font-size: 15px;">
        <span id="control" style="color: rgb(0, 0, 0);"><strong><span data-custom-class="heading_1"><h2>5. HOW LONG DO WE KEEP YOUR INFORMATION?</h2></span></strong></span>
      </span>
    </span>
    <span style="font-size: 15px; color: rgb(89, 89, 89);">
      <span data-custom-class="body_text"><strong><em>In Short: </em></strong><em>We keep your information for as long as necessary to fulfill the purposes outlined in this Privacy Notice unless otherwise required by law.</em></span>
    </span>
  </div>
  <div style="line-height: 1.5;"><br></div>
  <div style="line-height: 1.5;">
    <span style="font-size: 15px; color: rgb(89, 89, 89);">
      <span data-custom-class="body_text">We will only keep your personal information for as long as it is necessary for the purposes set out in this Privacy Notice, unless a longer retention period is required or permitted by law (such as tax, accounting, or other legal requirements). No purpose in this notice will require us keeping your personal information for longer than the period of time in which users have an account with us.</span>
    </span>
  </div>
  <div style="line-height: 1.5;"><br></div>
  <div style="line-height: 1.5;">
    <span style="font-size: 15px; color: rgb(89, 89, 89);">
      <span data-custom-class="body_text">When we have no ongoing legitimate business need to process your personal information, we will either delete or anonymize such information, or, if this is not possible (for example, because your personal information has been stored in backup archives), then we will securely store your personal information and isolate it from any further processing until deletion is possible.</span>
    </span>
  </div>
  <div style="line-height: 1.5;"><br></div>
  <div id="infosafe" style="line-height: 1.5;">
    <span style="color: rgb(127, 127, 127);">
      <span style="color: rgb(89, 89, 89); font-size: 15px;">
        <span id="control" style="color: rgb(0, 0, 0);"><strong><span data-custom-class="heading_1"><h2>6. HOW DO WE KEEP YOUR INFORMATION SAFE?</h2></span></strong></span>
      </span>
    </span>
    <span style="font-size: 15px; color: rgb(89, 89, 89);">
      <span data-custom-class="body_text"><strong><em>In Short: </em></strong><em>We aim to protect your personal information through a system of organizational and technical security measures.</em></span>
    </span>
  </div>
  <div style="line-height: 1.5;"><br></div>
  <div style="line-height: 1.5;">
    <span style="font-size: 15px; color: rgb(89, 89, 89);">
      <span data-custom-class="body_text">We have implemented appropriate and reasonable technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure, so we cannot promise or guarantee that hackers, cybercriminals, or other unauthorized third parties will not be able to defeat our security and improperly collect, access, steal, or modify your information. Although we will do our best to protect your personal information, transmission of personal information to and from our Services is at your own risk. You should only access the Services within a secure environment.</span>
    </span>
  </div>
  <div style="line-height: 1.5;"><br></div>
  <div id="infominors" style="line-height: 1.5;">
    <span style="color: rgb(127, 127, 127);">
      <span style="color: rgb(89, 89, 89); font-size: 15px;">
        <span id="control" style="color: rgb(0, 0, 0);"><strong><span data-custom-class="heading_1"><h2>7. DO WE COLLECT INFORMATION FROM MINORS?</h2></span></strong></span>
      </span>
    </span>
    <span style="font-size: 15px; color: rgb(89, 89, 89);">
      <span data-custom-class="body_text"><strong><em>In Short:</em></strong><em> We do not knowingly collect data from or market to children under 18 years of age.</em></span>
    </span>
  </div>
  <div style="line-height: 1.5;"><br></div>
  <div style="line-height: 1.5;">
    <span style="font-size: 15px; color: rgb(89, 89, 89);">
      <span data-custom-class="body_text">We do not knowingly collect, solicit data from, or market to children under 18 years of age, nor do we knowingly sell such personal information. By using the Services, you represent that you are at least 18 or that you are the parent or guardian of such a minor and consent to such minor dependent’s use of the Services. If we learn that personal information from users less than 18 years of age has been collected, we will deactivate the account and take reasonable measures to promptly delete such data from our records. If you become aware of any data we may have collected from children under age 18, please contact us at <a target="_blank" data-custom-class="link" href="mailto:trubillapp@gmail.com">trubillapp@gmail.com</a>.</span>
    </span>
  </div>
  <div style="line-height: 1.5;"><br></div>
  <div id="privacyrights" style="line-height: 1.5;">
    <span style="color: rgb(127, 127, 127);">
      <span style="color: rgb(89, 89, 89); font-size: 15px;">
        <span id="control" style="color: rgb(0, 0, 0);"><strong><span data-custom-class="heading_1"><h2>8. WHAT ARE YOUR PRIVACY RIGHTS?</h2></span></strong></span>
      </span>
    </span>
    <span style="font-size: 15px; color: rgb(89, 89, 89);">
      <span data-custom-class="body_text"><strong><em>In Short:</em></strong><em> You may review, change, or terminate your account at any time, depending on your country, province, or state of residence.</em></span>
    </span>
  </div>
  <div style="line-height: 1.5;"><br></div>
  <div id="withdrawconsent" style="line-height: 1.5;">
    <span style="font-size: 15px; color: rgb(89, 89, 89);">
      <span data-custom-class="body_text"><strong><u>Withdrawing your consent:</u></strong> If we are relying on your consent to process your personal information, which may be express and/or implied consent depending on the applicable law, you have the right to withdraw your consent at any time. You can withdraw your consent at any time by contacting us by using the contact details provided in the section <a data-custom-class="link" href="#contact"><span style="font-size: 15px; color: rgb(0, 58, 250);">HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</span></a> below.</span>
    </span>
  </div>
  <div style="line-height: 1.5;"><br></div>
  <div style="line-height: 1.5;">
    <span style="font-size: 15px;">
      <span data-custom-class="body_text">However, please note that this will not affect the lawfulness of the processing before its withdrawal nor, when applicable law allows, will it affect the processing of your personal information conducted in reliance on lawful processing grounds other than consent.</span>
    </span>
  </div>
  <div style="line-height: 1.5;"><span style="font-size: 15px;"><span data-custom-class="heading_2"><strong><h3>Account Information</h3></strong></span></span></div>
  <div style="line-height: 1.5;"><span data-custom-class="body_text"><span style="font-size: 15px;">If you would at any time like to review or change the information in your account or terminate your account, you can:</span></span></div>
  <ul>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span data-custom-class="body_text"><span style="font-size: 15px;">Log in to your account settings and update your user account.</span></span></li>
    <li data-custom-class="body_text" style="line-height: 1.5;"><span data-custom-class="body_text"><span style="font-size: 15px;">Contact us using the contact information provided.</span></span></li>
  </ul>
  <div style="line-height: 1.5;">
    <span style="font-size: 15px;"><span data-custom-class="body_text">Upon your request to terminate your account, we will deactivate or delete your account and information from our active databases. However, we may retain some information in our files to prevent fraud, troubleshoot problems, assist with any investigations, enforce our legal terms and/or comply with applicable legal requirements.</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>
  <div style="line-height: 1.5;">
    <span style="font-size: 15px; color: rgb(89, 89, 89);">
      <span data-custom-class="body_text"><strong><u>Cookies and similar technologies:</u></strong> Most Web browsers are set to accept cookies by default. If you prefer, you can usually choose to set your browser to remove cookies and to reject cookies. If you choose to remove cookies or reject cookies, this could affect certain features or services of our Services. For further information, please see our Cookie Notice: <span style="color: rgb(0, 58, 250);"><a target="_blank" data-custom-class="link" href="https://trubill.in/privacy">https://trubill.in/privacy</a></span>.</span>
    </span>
  </div>
  <div style="line-height: 1.5;"><br></div>
  <div style="line-height: 1.5;">
    <span data-custom-class="body_text"><span style="font-size: 15px;">If you have questions or comments about your privacy rights, you may email us at <a target="_blank" data-custom-class="link" href="mailto:trubillapp@gmail.com">trubillapp@gmail.com</a>.</span></span>
  </div>
  <div style="line-height: 1.5;"><br></div>
  <div id="DNT" style="line-height: 1.5;">
    <span style="color: rgb(127, 127, 127);">
      <span style="color: rgb(89, 89, 89); font-size: 15px;">
        <span id="control" style="color: rgb(0, 0, 0);"><strong><span data-custom-class="heading_1"><h2>9. CONTROLS FOR DO-NOT-TRACK FEATURES</h2></span></strong></span>
      </span>
    </span>
    <span style="font-size: 15px; color: rgb(89, 89, 89);">
      <span data-custom-class="body_text">Most web browsers and some mobile operating systems and mobile applications include a Do-Not-Track ("DNT") feature or setting you can activate to signal your privacy preference not to have data about your online browsing activities monitored and collected. At this stage, no uniform technology standard for recognizing and implementing DNT signals has been finalized. As such, we do not currently respond to DNT browser signals or any other mechanism that automatically communicates your choice not to be tracked online. If a standard for online tracking is adopted that we must follow in the future, we will inform you about that practice in a revised version of this Privacy Notice.</span>
    </span>
  </div>
  <div style="line-height: 1.5;"><br></div>
  <div id="clausea" style="line-height: 1.5;">
    <span><strong><span data-custom-class="heading_1"><h2>10. GST DATA AND FILING DISCLAIMER</h2></span></strong></span>
    <span data-custom-class="body_text">TruBill Invoice generates GST return data (including GSTR-1 and GSTR-3B) based solely on information entered by the user. TruBill Invoice is not a GST Suvidha Provider (GSP) and is not affiliated with or endorsed by the Goods and Services Tax Network (GSTN) or the Government of India. Users are solely responsible for verifying the accuracy of all GST data before submission to the GST portal. TruBill Invoice shall not be liable for any penalties, interest, or legal consequences arising from incorrect or incomplete GST filings made using data generated by this platform.</span>
  </div>
  <div style="line-height: 1.5;"><br></div>
  <div id="policyupdates" style="line-height: 1.5;">
    <span style="color: rgb(127, 127, 127);">
      <span style="color: rgb(89, 89, 89); font-size: 15px;">
        <span id="control" style="color: rgb(0, 0, 0);"><strong><span data-custom-class="heading_1"><h2>11. DO WE MAKE UPDATES TO THIS NOTICE?</h2></span></strong></span>
      </span>
    </span>
    <span style="font-size: 15px; color: rgb(89, 89, 89);">
      <span data-custom-class="body_text"><em><strong>In Short: </strong>Yes, we will update this notice as necessary to stay compliant with relevant laws.</em></span>
    </span>
  </div>
  <div style="line-height: 1.5;"><br></div>
  <div style="line-height: 1.5;">
    <span style="font-size: 15px; color: rgb(89, 89, 89);">
      <span data-custom-class="body_text">We may update this Privacy Notice from time to time. The updated version will be indicated by an updated "Revised" date at the top of this Privacy Notice. If we make material changes to this Privacy Notice, we may notify you either by prominently posting a notice of such changes or by directly sending you a notification. We encourage you to review this Privacy Notice frequently to be informed of how we are protecting your information.</span>
    </span>
  </div>
  <div style="line-height: 1.5;"><br></div>
  <div id="contact" style="line-height: 1.5;">
    <span style="color: rgb(127, 127, 127);">
      <span style="color: rgb(89, 89, 89); font-size: 15px;">
        <span id="control" style="color: rgb(0, 0, 0);"><strong><span data-custom-class="heading_1"><h2>12. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</h2></span></strong></span>
      </span>
    </span>
    <span style="font-size: 15px; color: rgb(89, 89, 89);">
      <span data-custom-class="body_text">If you have questions or comments about this notice, you may email us at <a target="_blank" data-custom-class="link" href="mailto:trubillapp@gmail.com">trubillapp@gmail.com</a> or contact us by post at:</span>
    </span>
  </div>
  <div style="line-height: 1.5;"><br></div>
  <div style="line-height: 1.5;">
    <span style="font-size: 15px; color: rgb(89, 89, 89);">
      <span data-custom-class="body_text"><strong>TruBill Invoice</strong></span>
    </span>
  </div>
  <div style="line-height: 1.5;">
    <span style="font-size: 15px;">
      <span data-custom-class="body_text">Vaidehi Falls Road</span>
    </span>
  </div>
  <div style="line-height: 1.5;">
    <span style="font-size: 15px;">
      <span data-custom-class="body_text">Coimbatore, Tamil Nadu 641109, India</span>
    </span>
  </div>
  <div style="line-height: 1.5;"><br></div>
  <div id="request" style="line-height: 1.5;">
    <span style="color: rgb(127, 127, 127);">
      <span style="color: rgb(89, 89, 89); font-size: 15px;">
        <span id="control" style="color: rgb(0, 0, 0);"><strong><span data-custom-class="heading_1"><h2>13. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</h2></span></strong></span>
      </span>
    </span>
    <span style="font-size: 15px; color: rgb(89, 89, 89);">
      <span data-custom-class="body_text">Based on the applicable laws of your country, you may have the right to request access to the personal information we collect from you, details about how we have processed it, correct inaccuracies, or delete your personal information. You may also have the right to withdraw your consent to our processing of your personal information. These rights may be limited in some circumstances by applicable law. To request to review, update, or delete your personal information, please fill out and submit a <a data-custom-class="link" href="https://app.termly.io/dsar/29352c0c-25b3-4799-a507-d425b159bd02" rel="noopener noreferrer" target="_blank">data subject access request</a>.</span>
    </span>
    <div style="display: none;"><a class="privacy123" href="https://app.termly.io/dsar/29352c0c-25b3-4799-a507-d425b159bd02"></a></div>
  </div>
</div>
<br>
<div><span data-custom-class='body_text'>This Privacy Policy was created using Termly's </span><a href="https://termly.io/products/privacy-policy-generator/" target="_blank" rel="noopener external" data-custom-class='link'>Privacy Policy Generator</a>.</div>
`;

export default function PrivacyPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="landing-page min-h-screen bg-[#f5f6fa] text-[#1a1d26] flex flex-col justify-between">
      {/* ─── Navbar ───────────────────────────────────────────── */}
      <div className="sticky top-0 z-50 w-full shrink-0">
        <div className="bg-[#001048] h-1 w-full" />
        <nav className="bg-white/95 backdrop-blur-xl border-b border-[#e8eaed]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 md:h-24 flex items-center justify-between">
            {/* Desktop Left: Logo */}
            <Link href="/" className="hidden md:flex items-center gap-3">
              <img src="/trubill-logo.png" alt="TruBill Logo" className="w-14 h-14 object-contain shrink-0" />
              <span className="font-heading font-black text-2xl tracking-tight">
                <span className="text-[#001048]">Tru</span>
                <span className="text-[#0050e8]">Bill</span>
              </span>
            </Link>

            {/* Mobile Left: Hamburger + Logo */}
            <div className="flex md:hidden items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-[#4b5563] hover:text-[#1a1d26] rounded-lg hover:bg-[#f3f4f6] transition-all"
                aria-label="Toggle menu"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  {mobileMenuOpen ? (
                    <>
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </>
                  ) : (
                    <>
                      <line x1="3" y1="12" x2="21" y2="12" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <line x1="3" y1="18" x2="21" y2="18" />
                    </>
                  )}
                </svg>
              </button>

              <Link href="/" className="flex items-center gap-2">
                <img src="/trubill-logo.png" alt="TruBill Logo" className="w-12 h-12 object-contain shrink-0" />
                <span className="font-heading font-black text-xl tracking-tight">
                  <span className="text-[#001048]">Tru</span>
                  <span className="text-[#0050e8]">Bill</span>
                </span>
              </Link>
            </div>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-8 font-semibold">
              <Link href="/#features" className="text-sm text-[#4b5563] hover:text-[#1a1d26] transition-colors">
                Features
              </Link>
              <Link href="/#how-it-works" className="text-sm text-[#4b5563] hover:text-[#1a1d26] transition-colors">
                How It Works
              </Link>
              <Link href="/#faq" className="text-sm text-[#4b5563] hover:text-[#1a1d26] transition-colors">
                FAQ
              </Link>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-semibold text-[#4b5563] hover:text-[#1a1d26] transition-colors px-3 py-2"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="text-sm font-bold text-white bg-[#0050e8] hover:bg-[#0043c4] px-5 py-2.5 rounded-xl transition-colors shadow-sm"
              >
                Start Free
              </Link>
            </div>

            {/* Mobile Right: Login */}
            <div className="flex md:hidden items-center">
              <Link
                href="/login"
                className="text-xs font-bold text-[#0050e8] border border-[#0050e8]/20 bg-emerald-50/50 hover:bg-emerald-50 px-3.5 py-1.5 rounded-lg transition-colors"
              >
                Log in
              </Link>
            </div>
          </div>
        </nav>
      </div>

      {/* ─── Mobile Dropdown Overlay ────────────────────────────── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 top-14 md:top-16 z-40 bg-black/40 backdrop-blur-sm md:hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed top-14 md:top-16 left-0 right-0 z-50 w-full bg-white border-b border-[#e8eaed] shadow-2xl flex flex-col md:hidden overflow-y-auto max-h-[calc(100vh-56px)]"
            >
              <div className="flex flex-col space-y-3 px-5 pt-4">
                <Link
                  href="/#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-semibold text-[#4b5563] hover:text-[#1a1d26] py-1 border-b border-slate-100/50 transition-colors"
                >
                  Features
                </Link>
                <Link
                  href="/#how-it-works"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-semibold text-[#4b5563] hover:text-[#1a1d26] py-1 border-b border-slate-100/50 transition-colors"
                >
                  How It Works
                </Link>
                <Link
                  href="/#faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-semibold text-[#4b5563] hover:text-[#1a1d26] py-1 border-b border-slate-100/50 transition-colors"
                >
                  FAQ
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-semibold text-[#4b5563] hover:text-[#1a1d26] py-1 border-b border-slate-100/50 transition-colors"
                >
                  Login
                </Link>
              </div>
              <div className="px-5 pt-4">
                <p className="text-[11px] text-[#6b7280] leading-relaxed">
                  Easy WhatsApp billing, manage customer payments, track outstanding balances, control inventory, and simplify accounting with TruBill - Tamil Nadu's best lightweight billing software. Start billing free today.
                </p>
              </div>
              <div className="px-5 py-4 pb-6">
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full bg-[#0050e8] hover:bg-[#0043c4] text-white text-center font-extrabold text-sm py-3 px-4 rounded-xl transition-colors shadow-sm"
                >
                  Start Billing Free Now!
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Main Content Container ────────────────────────────── */}
      <main className="flex-1 bg-white border-y border-[#e8eaed]">
        <div className="max-w-[800px] mx-auto px-6 py-10 sm:py-16 text-slate-800 leading-relaxed font-sans">
          <div dangerouslySetInnerHTML={{ __html: PRIVACY_HTML }} />
        </div>
      </main>

      {/* ─── Footer ───────────────────────────────────────────── */}
      <footer className="bg-white border-t border-[#e8eaed] text-sm text-[#4b5563] shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 pb-8 md:pb-12 border-b border-[#e8eaed]">
            <div className="col-span-2 md:col-span-1 space-y-3">
              <div className="flex items-center gap-2.5">
                <img src="/trubill-logo.png" alt="TruBill Logo" className="w-8 h-8 object-contain shrink-0" />
                <span className="font-heading font-black text-base">
                  <span className="text-[#001048]">Tru</span>
                  <span className="text-[#0050e8]">Bill</span>
                  <span className="text-[#1a1d26]"> Invoice</span>
                </span>
              </div>
              <p className="text-xs text-[#6b7280] leading-relaxed">
                Simple, lightweight billing software designed for small businesses, supermarkets, and freelancers in Tamil Nadu.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-[#1a1d26] text-xs uppercase tracking-wider">Product</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/#features" className="hover:text-[#1a1d26] transition-colors">Features</Link></li>
                <li><Link href="/#how-it-works" className="hover:text-[#1a1d26] transition-colors">How it Works</Link></li>
                <li><Link href="/login" className="hover:text-[#1a1d26] transition-colors">Sandbox Login</Link></li>
                <li><Link href="/signup" className="hover:text-[#1a1d26] transition-colors">Create Account</Link></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-[#1a1d26] text-xs uppercase tracking-wider">Resources</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/#faq" className="hover:text-[#1a1d26] transition-colors">FAQ</Link></li>
                <li><span className="text-[#9ca3af]">A4 PDF Format</span></li>
                <li><span className="text-[#9ca3af]">A5 PDF Format</span></li>
                <li><span className="text-[#9ca3af]">Tax Calculator</span></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-[#1a1d26] text-xs uppercase tracking-wider">HQ Address</h4>
              <p className="text-xs text-[#6b7280] leading-relaxed">
                TruBill Invoice<br />
                Coimbatore, Tamil Nadu<br />
                support@trubill.in
              </p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-between pt-6 md:pt-8 text-[11px] sm:text-xs text-[#6b7280] gap-3">
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-3 gap-y-1">
              <span>© {new Date().getFullYear()} TruBill. All rights reserved.</span>
              <span className="hidden sm:inline text-slate-300">•</span>
              <span>MSME Registered — UDYAM-TN-03-0331333</span>
              <span className="hidden sm:inline text-slate-300">•</span>
              <Link href="/privacy" className="hover:text-[#1a1d26] transition-colors">Privacy Policy</Link>
              <span className="hidden sm:inline text-slate-300">•</span>
              <Link href="/terms" className="hover:text-[#1a1d26] transition-colors">Terms of Service</Link>
            </div>
            <div className="flex gap-4">
              <span>Made for Shopkeepers in Tamil Nadu 🇮🇳</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
