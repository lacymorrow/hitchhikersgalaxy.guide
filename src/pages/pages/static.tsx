import { PagesRouterLayout } from "@/components/layouts/pages-router-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface StaticPageProps {
  buildTime: string;
}

export default function StaticPage({ buildTime }: StaticPageProps) {
  return (
    <PagesRouterLayout>
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-4xl font-bold">Static Page Example</h1>
        <Card>
          <CardHeader>
            <CardTitle>Static Site Generation (SSG)</CardTitle>
            <CardDescription>
              This page is statically generated at build time using getStaticProps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">This page was built at: {buildTime}</p>
            <div className="mt-4 rounded-lg bg-muted p-4">
              <pre className="whitespace-pre-wrap">
                <code>
                  {`
// This function runs at build time
export async function getStaticProps() {
  return {
    props: {
      buildTime: new Date().toISOString()
    }
  }
}`}
                </code>
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </PagesRouterLayout>
  );
}

// eslint-disable-next-line @typescript-eslint/require-await
export async function getStaticProps() {
  return {
    props: {
      buildTime: new Date().toISOString(),
    },
  };
}
