import { PagesLayout } from '@/components/layouts/pages-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/router'

export default function PagesDemo() {
  const router = useRouter()

  return (
    <PagesLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Pages Router Demo</h1>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Static Page Example</CardTitle>
              <CardDescription>
                Demonstrates static page generation in the Pages Router
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => router.push('/pages-demo/static')}>
                View Static Page
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dynamic Page Example</CardTitle>
              <CardDescription>
                Shows how dynamic routes work in the Pages Router
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => router.push('/pages-demo/dynamic')}>
                View Dynamic Page
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Route Example</CardTitle>
              <CardDescription>
                Demonstrates API routes in the Pages Router
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => router.push('/pages-demo/api-example')}>
                View API Example
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pages vs App Router</CardTitle>
              <CardDescription>
                Compare the differences between Pages and App Router
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => router.push('/')}>
                Back to App Router
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PagesLayout>
  )
}
