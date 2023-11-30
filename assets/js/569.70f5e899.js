"use strict";(self.webpackChunkpersonalpage=self.webpackChunkpersonalpage||[]).push([[569],{1460:(e,t,a)=>{a.d(t,{Z:()=>f});var s=a(7294),n=a(4334),r=a(7961),l=a(7524),i=a(9960),o=a(5999),c=a(6550),m=a(8596);function d(e){const{pathname:t}=(0,c.TH)();return(0,s.useMemo)((()=>e.filter((e=>function(e,t){return!(e.unlisted&&!(0,m.Mg)(e.permalink,t))}(e,t)))),[e,t])}const u={sidebar:"sidebar_re4s",sidebarItemTitle:"sidebarItemTitle_pO2u",sidebarItemList:"sidebarItemList_Yudw",sidebarItem:"sidebarItem__DBe",sidebarItemLink:"sidebarItemLink_mo7H",sidebarItemLinkActive:"sidebarItemLinkActive_I1ZP"};var h=a(5893);function g(e){let{sidebar:t}=e;const a=d(t.items);return(0,h.jsx)("aside",{className:"col col--3",children:(0,h.jsxs)("nav",{className:(0,n.Z)(u.sidebar,"thin-scrollbar"),"aria-label":(0,o.I)({id:"theme.blog.sidebar.navAriaLabel",message:"Blog recent posts navigation",description:"The ARIA label for recent posts in the blog sidebar"}),children:[(0,h.jsx)("div",{className:(0,n.Z)(u.sidebarItemTitle,"margin-bottom--md"),children:t.title}),(0,h.jsx)("ul",{className:(0,n.Z)(u.sidebarItemList,"clean-list"),children:a.map((e=>(0,h.jsx)("li",{className:u.sidebarItem,children:(0,h.jsx)(i.Z,{isNavLink:!0,to:e.permalink,className:u.sidebarItemLink,activeClassName:u.sidebarItemLinkActive,children:e.title})},e.permalink)))})]})})}var p=a(3102);function x(e){let{sidebar:t}=e;const a=d(t.items);return(0,h.jsx)("ul",{className:"menu__list",children:a.map((e=>(0,h.jsx)("li",{className:"menu__list-item",children:(0,h.jsx)(i.Z,{isNavLink:!0,to:e.permalink,className:"menu__link",activeClassName:"menu__link--active",children:e.title})},e.permalink)))})}function j(e){return(0,h.jsx)(p.Zo,{component:x,props:e})}function b(e){let{sidebar:t}=e;const a=(0,l.i)();return t?.items.length?"mobile"===a?(0,h.jsx)(j,{sidebar:t}):(0,h.jsx)(g,{sidebar:t}):null}function f(e){const{sidebar:t,toc:a,children:s,...l}=e,i=t&&t.items.length>0;return(0,h.jsx)(r.Z,{...l,children:(0,h.jsx)("div",{className:"container margin-vert--lg",children:(0,h.jsxs)("div",{className:"row",children:[(0,h.jsx)(b,{sidebar:t}),(0,h.jsx)("main",{className:(0,n.Z)("col",{"col--7":i,"col--9 col--offset-1":!i}),itemScope:!0,itemType:"https://schema.org/Blog",children:s}),a&&(0,h.jsx)("div",{className:"col col--2",children:a})]})})})}},756:(e,t,a)=>{a.d(t,{Z:()=>D});var s=a(7294),n=a(4334),r=a(9460),l=a(4996),i=a(5893);function o(e){let{children:t,className:a}=e;const{frontMatter:s,assets:n,metadata:{description:o}}=(0,r.C)(),{withBaseUrl:c}=(0,l.C)(),m=n.image??s.image,d=s.keywords??[];return(0,i.jsxs)("article",{className:a,itemProp:"blogPost",itemScope:!0,itemType:"https://schema.org/BlogPosting",children:[o&&(0,i.jsx)("meta",{itemProp:"description",content:o}),m&&(0,i.jsx)("link",{itemProp:"image",href:c(m,{absolute:!0})}),d.length>0&&(0,i.jsx)("meta",{itemProp:"keywords",content:d.join(",")}),t]})}var c=a(9960);const m={title:"title_f1Hy"};function d(e){let{className:t}=e;const{metadata:a,isBlogPostPage:s}=(0,r.C)(),{permalink:l,title:o}=a,d=s?"h1":"h2";return(0,i.jsx)(d,{className:(0,n.Z)(m.title,t),itemProp:"headline",children:s?o:(0,i.jsx)(c.Z,{itemProp:"url",to:l,children:o})})}var u=a(5999),h=a(2263);const g=["zero","one","two","few","many","other"];function p(e){return g.filter((t=>e.includes(t)))}const x={locale:"en",pluralForms:p(["one","other"]),select:e=>1===e?"one":"other"};function j(){const{i18n:{currentLocale:e}}=(0,h.Z)();return(0,s.useMemo)((()=>{try{return function(e){const t=new Intl.PluralRules(e);return{locale:e,pluralForms:p(t.resolvedOptions().pluralCategories),select:e=>t.select(e)}}(e)}catch(t){return console.error(`Failed to use Intl.PluralRules for locale "${e}".\nDocusaurus will fallback to the default (English) implementation.\nError: ${t.message}\n`),x}}),[e])}function b(){const e=j();return{selectMessage:(t,a)=>function(e,t,a){const s=e.split("|");if(1===s.length)return s[0];s.length>a.pluralForms.length&&console.error(`For locale=${a.locale}, a maximum of ${a.pluralForms.length} plural forms are expected (${a.pluralForms.join(",")}), but the message contains ${s.length}: ${e}`);const n=a.select(t),r=a.pluralForms.indexOf(n);return s[Math.min(r,s.length-1)]}(a,t,e)}}const f={container:"container_mt6G"};function v(e){let{readingTime:t}=e;const a=function(){const{selectMessage:e}=b();return t=>{const a=Math.ceil(t);return e(a,(0,u.I)({id:"theme.blog.post.readingTime.plurals",description:'Pluralized label for "{readingTime} min read". Use as much plural forms (separated by "|") as your language support (see https://www.unicode.org/cldr/cldr-aux/charts/34/supplemental/language_plural_rules.html)',message:"One min read|{readingTime} min read"},{readingTime:a}))}}();return(0,i.jsx)(i.Fragment,{children:a(t)})}function N(e){let{date:t,formattedDate:a}=e;return(0,i.jsx)("time",{dateTime:t,itemProp:"datePublished",children:a})}function _(){return(0,i.jsx)(i.Fragment,{children:" \xb7 "})}function P(e){let{className:t}=e;const{metadata:a}=(0,r.C)(),{date:s,formattedDate:l,readingTime:o}=a;return(0,i.jsxs)("div",{className:(0,n.Z)(f.container,"margin-vert--md",t),children:[(0,i.jsx)(N,{date:s,formattedDate:l}),void 0!==o&&(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(_,{}),(0,i.jsx)(v,{readingTime:o})]})]})}function Z(e){return e.href?(0,i.jsx)(c.Z,{...e}):(0,i.jsx)(i.Fragment,{children:e.children})}function k(e){let{author:t,className:a}=e;const{name:s,title:r,url:l,imageURL:o,email:c}=t,m=l||c&&`mailto:${c}`||void 0;return(0,i.jsxs)("div",{className:(0,n.Z)("avatar margin-bottom--sm",a),children:[o&&(0,i.jsx)(Z,{href:m,className:"avatar__photo-link",children:(0,i.jsx)("img",{className:"avatar__photo",src:o,alt:s,itemProp:"image"})}),s&&(0,i.jsxs)("div",{className:"avatar__intro",itemProp:"author",itemScope:!0,itemType:"https://schema.org/Person",children:[(0,i.jsx)("div",{className:"avatar__name",children:(0,i.jsx)(Z,{href:m,itemProp:"url",children:(0,i.jsx)("span",{itemProp:"name",children:s})})}),r&&(0,i.jsx)("small",{className:"avatar__subtitle",itemProp:"description",children:r})]})]})}const C={authorCol:"authorCol_Hf19",imageOnlyAuthorRow:"imageOnlyAuthorRow_pa_O",imageOnlyAuthorCol:"imageOnlyAuthorCol_G86a"};function T(e){let{className:t}=e;const{metadata:{authors:a},assets:s}=(0,r.C)();if(0===a.length)return null;const l=a.every((e=>{let{name:t}=e;return!t}));return(0,i.jsx)("div",{className:(0,n.Z)("margin-top--md margin-bottom--sm",l?C.imageOnlyAuthorRow:"row",t),children:a.map(((e,t)=>(0,i.jsx)("div",{className:(0,n.Z)(!l&&"col col--6",l?C.imageOnlyAuthorCol:C.authorCol),children:(0,i.jsx)(k,{author:{...e,imageURL:s.authorsImageUrls[t]??e.imageURL}})},t)))})}function w(){return(0,i.jsxs)("header",{children:[(0,i.jsx)(d,{}),(0,i.jsx)(P,{}),(0,i.jsx)(T,{})]})}var I=a(8780),F=a(2196);function L(e){let{children:t,className:a}=e;const{isBlogPostPage:s}=(0,r.C)();return(0,i.jsx)("div",{id:s?I.blogPostContainerID:void 0,className:(0,n.Z)("markdown",a),itemProp:"articleBody",children:(0,i.jsx)(F.Z,{children:t})})}var y=a(4881),B=a(6233);function R(){return(0,i.jsx)("b",{children:(0,i.jsx)(u.Z,{id:"theme.blog.post.readMore",description:"The label used in blog post item excerpts to link to full blog posts",children:"Read More"})})}function M(e){const{blogPostTitle:t,...a}=e;return(0,i.jsx)(c.Z,{"aria-label":(0,u.I)({message:"Read more about {title}",id:"theme.blog.post.readMoreLabel",description:"The ARIA label for the link to full blog posts from excerpts"},{title:t}),...a,children:(0,i.jsx)(R,{})})}const A={blogPostFooterDetailsFull:"blogPostFooterDetailsFull_mRVl"};function O(){const{metadata:e,isBlogPostPage:t}=(0,r.C)(),{tags:a,title:s,editUrl:l,hasTruncateMarker:o}=e,c=!t&&o,m=a.length>0;return m||c||l?(0,i.jsxs)("footer",{className:(0,n.Z)("row docusaurus-mt-lg",t&&A.blogPostFooterDetailsFull),children:[m&&(0,i.jsx)("div",{className:(0,n.Z)("col",{"col--9":c}),children:(0,i.jsx)(B.Z,{tags:a})}),t&&l&&(0,i.jsx)("div",{className:"col margin-top--sm",children:(0,i.jsx)(y.Z,{editUrl:l})}),c&&(0,i.jsx)("div",{className:(0,n.Z)("col text--right",{"col--3":m}),children:(0,i.jsx)(M,{blogPostTitle:s,to:e.permalink})})]}):null}function D(e){let{children:t,className:a}=e;const s=function(){const{isBlogPostPage:e}=(0,r.C)();return e?void 0:"margin-bottom--xl"}();return(0,i.jsxs)(o,{className:(0,n.Z)(s,a),children:[(0,i.jsx)(w,{}),(0,i.jsx)(L,{children:t}),(0,i.jsx)(O,{})]})}},4881:(e,t,a)=>{a.d(t,{Z:()=>m});a(7294);var s=a(5999),n=a(5281),r=a(9960),l=a(4334);const i={iconEdit:"iconEdit_Z9Sw"};var o=a(5893);function c(e){let{className:t,...a}=e;return(0,o.jsx)("svg",{fill:"currentColor",height:"20",width:"20",viewBox:"0 0 40 40",className:(0,l.Z)(i.iconEdit,t),"aria-hidden":"true",...a,children:(0,o.jsx)("g",{children:(0,o.jsx)("path",{d:"m34.5 11.7l-3 3.1-6.3-6.3 3.1-3q0.5-0.5 1.2-0.5t1.1 0.5l3.9 3.9q0.5 0.4 0.5 1.1t-0.5 1.2z m-29.5 17.1l18.4-18.5 6.3 6.3-18.4 18.4h-6.3v-6.2z"})})})}function m(e){let{editUrl:t}=e;return(0,o.jsxs)(r.Z,{to:t,className:n.k.common.editThisPage,children:[(0,o.jsx)(c,{}),(0,o.jsx)(s.Z,{id:"theme.common.editThisPage",description:"The link label to edit the current page",children:"Edit this page"})]})}},2244:(e,t,a)=>{a.d(t,{Z:()=>l});a(7294);var s=a(4334),n=a(9960),r=a(5893);function l(e){const{permalink:t,title:a,subLabel:l,isNext:i}=e;return(0,r.jsxs)(n.Z,{className:(0,s.Z)("pagination-nav__link",i?"pagination-nav__link--next":"pagination-nav__link--prev"),to:t,children:[l&&(0,r.jsx)("div",{className:"pagination-nav__sublabel",children:l}),(0,r.jsx)("div",{className:"pagination-nav__label",children:a})]})}},6233:(e,t,a)=>{a.d(t,{Z:()=>m});a(7294);var s=a(4334),n=a(5999),r=a(9960);const l={tag:"tag_zVej",tagRegular:"tagRegular_sFm0",tagWithCount:"tagWithCount_h2kH"};var i=a(5893);function o(e){let{permalink:t,label:a,count:n}=e;return(0,i.jsxs)(r.Z,{href:t,className:(0,s.Z)(l.tag,n?l.tagWithCount:l.tagRegular),children:[a,n&&(0,i.jsx)("span",{children:n})]})}const c={tags:"tags_jXut",tag:"tag_QGVx"};function m(e){let{tags:t}=e;return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)("b",{children:(0,i.jsx)(n.Z,{id:"theme.tags.tagsListLabel",description:"The label alongside a tag list",children:"Tags:"})}),(0,i.jsx)("ul",{className:(0,s.Z)(c.tags,"padding--none","margin-left--sm"),children:t.map((e=>{let{label:t,permalink:a}=e;return(0,i.jsx)("li",{className:c.tag,children:(0,i.jsx)(o,{label:t,permalink:a})},a)}))})]})}},9460:(e,t,a)=>{a.d(t,{C:()=>o,n:()=>i});var s=a(7294),n=a(902),r=a(5893);const l=s.createContext(null);function i(e){let{children:t,content:a,isBlogPostPage:n=!1}=e;const i=function(e){let{content:t,isBlogPostPage:a}=e;return(0,s.useMemo)((()=>({metadata:t.metadata,frontMatter:t.frontMatter,assets:t.assets,toc:t.toc,isBlogPostPage:a})),[t,a])}({content:a,isBlogPostPage:n});return(0,r.jsx)(l.Provider,{value:i,children:t})}function o(){const e=(0,s.useContext)(l);if(null===e)throw new n.i6("BlogPostProvider");return e}}}]);