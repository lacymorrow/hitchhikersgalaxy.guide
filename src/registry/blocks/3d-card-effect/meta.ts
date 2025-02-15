export default {
  "meta": {
    "category": "UI Components",
    "tags": [
      "card",
      "background",
      "special"
    ],
    "status": "stable",
    "version": "1.0.0",
    "author": "mannupaaji",
    "description": "A card perspective effect, hover over the card to elevate card elements.",
    "repository": {
      "type": "git",
      "url": "https://github.com/steven-tey/aceternity-ui"
    },
    "license": "MIT",
    "docsUrl": "https://ui.aceternity.com/components/3d-card-effect"
  },
  "examples": [
    {
      "title": "demo-01",
      "code": "\"use client\";\n \nimport Image from \"next/image\";\nimport React from \"react\";\nimport { CardBody, CardContainer, CardItem } from \"../ui/3d-card\";\nimport Link from \"next/link\";\n \nexport function ThreeDCardDemo() {\n  return (\n    <CardContainer className=\"inter-var\">\n      <CardBody className=\"bg-gray-50 relative group/card  dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-auto sm:w-[30rem] h-auto rounded-xl p-6 border  \">\n        <CardItem\n          translateZ=\"50\"\n          className=\"text-xl font-bold text-neutral-600 dark:text-white\"\n        >\n          Make things float in air\n        </CardItem>\n        <CardItem\n          as=\"p\"\n          translateZ=\"60\"\n          className=\"text-neutral-500 text-sm max-w-sm mt-2 dark:text-neutral-300\"\n        >\n          Hover over this card to unleash the power of CSS perspective\n        </CardItem>\n        <CardItem translateZ=\"100\" className=\"w-full mt-4\">\n          <Image\n            src=\"https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2560&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D\"\n            height=\"1000\"\n            width=\"1000\"\n            className=\"h-60 w-full object-cover rounded-xl group-hover/card:shadow-xl\"\n            alt=\"thumbnail\"\n          />\n        </CardItem>\n        <div className=\"flex justify-between items-center mt-20\">\n          <CardItem\n            translateZ={20}\n            as={Link}\n            href=\"https://twitter.com/mannupaaji\"\n            target=\"__blank\"\n            className=\"px-4 py-2 rounded-xl text-xs font-normal dark:text-white\"\n          >\n            Try now →\n          </CardItem>\n          <CardItem\n            translateZ={20}\n            as=\"button\"\n            className=\"px-4 py-2 rounded-xl bg-black dark:bg-white dark:text-black text-white text-xs font-bold\"\n          >\n            Sign up\n          </CardItem>\n        </div>\n      </CardBody>\n    </CardContainer>\n  );\n}",
      "variant": "demo-01"
    },
    {
      "title": "demo-02",
      "code": "\"use client\";\n \nimport Image from \"next/image\";\nimport React from \"react\";\nimport { CardBody, CardContainer, CardItem } from \"../ui/3d-card\";\n \nexport function ThreeDCardDemo() {\n  return (\n    <CardContainer className=\"inter-var\">\n      <CardBody className=\"bg-gray-50 relative group/card  dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-auto sm:w-[30rem] h-auto rounded-xl p-6 border  \">\n        <CardItem\n          translateZ=\"50\"\n          className=\"text-xl font-bold text-neutral-600 dark:text-white\"\n        >\n          Make things float in air\n        </CardItem>\n        <CardItem\n          as=\"p\"\n          translateZ=\"60\"\n          className=\"text-neutral-500 text-sm max-w-sm mt-2 dark:text-neutral-300\"\n        >\n          Hover over this card to unleash the power of CSS perspective\n        </CardItem>\n        <CardItem\n          translateZ=\"100\"\n          rotateX={20}\n          rotateZ={-10}\n          className=\"w-full mt-4\"\n        >\n          <Image\n            src=\"https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2560&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D\"\n            height=\"1000\"\n            width=\"1000\"\n            className=\"h-60 w-full object-cover rounded-xl group-hover/card:shadow-xl\"\n            alt=\"thumbnail\"\n          />\n        </CardItem>\n        <div className=\"flex justify-between items-center mt-20\">\n          <CardItem\n            translateZ={20}\n            translateX={-40}\n            as=\"button\"\n            className=\"px-4 py-2 rounded-xl text-xs font-normal dark:text-white\"\n          >\n            Try now →\n          </CardItem>\n          <CardItem\n            translateZ={20}\n            translateX={40}\n            as=\"button\"\n            className=\"px-4 py-2 rounded-xl bg-black dark:bg-white dark:text-black text-white text-xs font-bold\"\n          >\n            Sign up\n          </CardItem>\n        </div>\n      </CardBody>\n    </CardContainer>\n  );\n}",
      "variant": "demo-02"
    }
  ],
  "installInstructions": [
    {
      "title": "Installation",
      "code": "npx shadcn@latest add https://ui.aceternity.com/registry/3d-card.json"
    }
  ]
};