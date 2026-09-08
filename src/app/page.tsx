import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Star,
  Users,
  Clock,
  Shield,
  Target,
  BookOpen,
  CheckCircle,
  Zap,
  Brain,
  Globe,
  Award,
  TrendingUp,
  Sparkles,
} from "lucide-react";

const stats = [
  { value: "94%", label: "Match Rate", icon: Target, color: "text-primary-600" },
  { value: "24hr", label: "Demo Setup", icon: Clock, color: "text-secondary-600" },
  { value: "15%", label: "Platform Fee", icon: Shield, color: "text-success-600" },
  { value: "100%", label: "Money Back", icon: Award, color: "text-error-600" },
];

const features = [
  {
    icon: Brain,
    title: "AI-Powered Matching",
    description: "Our algorithm analyzes syllabus, goals, schedule & budget to find your perfect tutor match with 94% accuracy.",
  },
  {
    icon: Zap,
    title: "Automated Scheduling",
    description: "Google Calendar & Meet integration. Recurring classes, reminders, rescheduling - all handled automatically.",
  },
  {
    icon: Globe,
    title: "Live Video Classes",
    description: "Google Meet built-in. Screen sharing, recording, whiteboard. Join with one click - no downloads needed.",
  },
  {
    icon: BookOpen,
    title: "Smart Assignments",
    description: "Teachers create, students submit, AI helps grade. Progress tracking with weak/strong topic detection.",
  },
  {
    icon: TrendingUp,
    title: "Real-Time Progress",
    description: "Visual dashboards, AI insights, study plans that adapt. Parents get monthly reports automatically.",
  },
  {
    icon: Sparkles,
    title: "Transparent Payments",
    description: "Razorpay integration. Auto-billing, instant payouts, 15% platform fee. No hidden charges ever.",
  },
];

const subjects = [
  { name: "Mathematics", icon: "📐", count: 127, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  { name: "Physics", icon: "⚡", count: 89, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  { name: "Chemistry", icon: "🧪", count: 76, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  { name: "Biology", icon: "🧬", count: 45, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  { name: "English", icon: "📚", count: 34, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  { name: "Computer Science", icon: "💻", count: 28, color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
  { name: "JEE Advanced", icon: "🎯", count: 67, color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  { name: "NEET", icon: "🏥", count: 54, color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300" },
];

const testimonials = [
  {
    quote: "My daughter's Math score went from 65% to 92% in 3 months. The AI matching found the perfect tutor who understood her learning style perfectly.",
    author: "Priya Sharma",
    role: "Parent of Grade 10 student",
    avatar: "PS",
    rating: 5,
  },
  {
    quote: "Excellent JEE preparation. Customized problem sets and regular mock tests. Very responsive to doubts. Got AIR 1,247!",
    author: "Rohan M.",
    role: "Student, Grade 11",
    avatar: "RM",
    rating: 5,
  },
  {
    quote: "The automated scheduling is a lifesaver. No more back-and-forth messages. Classes happen on time, every time. Highly recommended!",
    author: "Anjali K.",
    role: "Parent of Grade 12 student",
    avatar: "AK",
    rating: 5,
  },
];

const steps = [
  {
    number: "01",
    title: "Tell Us Your Needs",
    description: "Upload syllabus, set goals, preferences, schedule, and budget.",
    icon: BookOpen,
  },
  {
    number: "02",
    title: "Meet Your Tutor",
    description: "Book free demo classes with AI-matched teachers. Review and confirm.",
    icon: Users,
  },
  {
    number: "03",
    title: "Learn & Grow",
    description: "Auto-scheduling, assignments, progress tracking. We handle the rest.",
    icon: Target,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-neutral-200/50 dark:border-neutral-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary-600 dark:text-primary-400">
                <BookOpen className="h-7 w-7" />
                <span>TutorConnect</span>
              </Link>
              <div className="hidden md:flex items-center gap-6">
                <Link href="/teachers" className="text-sm font-medium text-neutral-600 hover:text-primary-600 dark:text-neutral-300 dark:hover:text-primary-400 transition-colors">
                  Find Teachers
                </Link>
                <Link href="/how-it-works" className="text-sm font-medium text-neutral-600 hover:text-primary-600 dark:text-neutral-300 dark:hover:text-primary-400 transition-colors">
                  How It Works
                </Link>
                <Link href="/subjects" className="text-sm font-medium text-neutral-600 hover:text-primary-600 dark:text-neutral-300 dark:hover:text-primary-400 transition-colors">
                  Subjects
                </Link>
                <Link href="/pricing" className="text-sm font-medium text-neutral-600 hover:text-primary-600 dark:text-neutral-300 dark:hover:text-primary-400 transition-colors">
                  Pricing
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm font-medium text-neutral-600 hover:text-primary-600 dark:text-neutral-300 dark:hover:text-primary-400 transition-colors">
                Login
              </Link>
              <Link href="/register?role=STUDENT">
                <Button size="lg">Get Started Free</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-20 right-10 w-96 h-96 bg-primary-100/50 dark:bg-primary-900/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 left-10 w-72 h-72 bg-secondary-100/50 dark:bg-secondary-900/20 rounded-full blur-3xl animate-pulse delay-1000" />
          </div>

          <div className="text-center max-w-4xl mx-auto relative">
            <Badge variant="primary" className="mb-6 animate-in">
              <Sparkles className="h-3 w-3 mr-1" />
              New: AI Study Plan Generator & Syllabus Analyzer
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-neutral-900 dark:text-white mb-6 animate-in">
              Find Your Perfect Tutor.<br />
              <span className="gradient-text">Learn at Your Pace.</span>
            </h1>

            <p className="text-lg sm:text-xl text-neutral-600 dark:text-neutral-300 mb-10 max-w-2xl mx-auto animate-in">
              Personalized 1-on-1 tutoring for Grades 8-12, JEE, NEET, and Board Exams.
              AI-matched teachers. Automated scheduling. Transparent pricing.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-in">
              <Link href="/register?role=STUDENT">
                <Button size="xl" className="gap-2">
                  I'm a Student
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/register?role=TEACHER">
                <Button size="xl" variant="outline" className="gap-2">
                  I'm a Teacher
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-neutral-500 dark:text-neutral-400 animate-in">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <span>4.9/5 from 2,847 reviews</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span>500+ verified teachers</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                <span>50,000+ classes conducted</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <span>100% money-back guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center p-6 animate-in">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 mb-4 mx-auto">
                <stat.icon className="h-8 w-8" />
              </div>
              <div className="text-3xl font-bold text-neutral-900 dark:text-white">{stat.value}</div>
              <div className="text-neutral-600 dark:text-neutral-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-in">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-4">How It Works</h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto">
              Three simple steps to start learning with your perfect tutor
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <Card key={step.number} className="relative overflow-hidden animate-in hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 mb-4 mx-auto">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-2xl">{step.number}. {step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-600 dark:text-neutral-300">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Subjects */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 animate-in">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-4">Popular Subjects</h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-300">Expert tutors across all major subjects and exams</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {subjects.map((subject) => (
              <Link
                key={subject.name}
                href={`/teachers?subject=${encodeURIComponent(subject.name)}`}
                className={`group block p-6 bg-white rounded-2xl border border-neutral-200 hover:border-primary-300 hover:shadow-lg transition-all dark:bg-neutral-900 dark:border-neutral-700 dark:hover:border-primary-700 ${subject.color}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{subject.icon}</span>
                  <h3 className="font-semibold text-neutral-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {subject.name}
                  </h3>
                </div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{subject.count} teachers available</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-in">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-4">Everything You Need to Succeed</h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto">
              Powerful features that make learning effortless for students, teachers, and parents
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={feature.title} className="animate-in hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 mb-4">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">{feature.title}</h3>
                  <p className="text-neutral-600 dark:text-neutral-300">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-in">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white mb-4">Trusted by Thousands</h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-300">What students and parents say about TutorConnect</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="animate-in hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-neutral-700 dark:text-neutral-200 mb-6 italic">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-medium dark:bg-primary-900/30 dark:text-primary-400">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900 dark:text-white">{testimonial.author}</p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 p-12 sm:p-16">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-20 right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute bottom-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
            </div>
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Ready to Start Learning?</h2>
              <p className="text-lg text-primary-100 mb-8">Join thousands of students who've found their perfect tutor on TutorConnect.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register?role=STUDENT">
                  <Button size="xl" variant="secondary" className="gap-2">
                    Start Free
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/teachers">
                  <Button size="xl" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10 gap-2">
                    Browse Teachers
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-neutral-400 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 font-bold text-2xl text-white mb-4">
                <BookOpen className="h-7 w-7 text-primary-400" />
                <span>TutorConnect</span>
              </Link>
              <p className="text-sm text-neutral-500">Personalized tutoring platform connecting students with expert teachers.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/teachers" className="hover:text-white transition-colors">Find Teachers</Link></li>
                <li><Link href="/how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
                <li><Link href="/subjects" className="hover:text-white transition-colors">Subjects</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
                <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-neutral-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm">© 2024 TutorConnect. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-white transition-colors">Twitter</a>
              <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
              <a href="#" className="hover:text-white transition-colors">Instagram</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}