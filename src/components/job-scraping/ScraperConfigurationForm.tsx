import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { JobSourceSelector } from "./JobSourceSelector";
import { Industry, JobSource, ScraperConfiguration } from "@/integrations/supabase/client";

const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  source_id: z.string().optional().nullable(),
  url: z.string().url("Must be a valid URL").optional().nullable(),
  frequency: z.enum(["hourly", "daily", "weekly", "monthly"]),
  keywords: z.array(z.string()).optional(),
  locations: z.array(z.string()).optional(),
  job_types: z.array(z.string()).optional(),
  industries: z.array(z.string()).optional(),
  experience_levels: z.array(z.string()).optional(),
  salary_range: z.object({
    min: z.number().nullable(),
    max: z.number().nullable(),
    currency: z.string().default("USD"),
  }).optional(),
  is_active: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface ScraperConfigurationFormProps {
  initialData?: Partial<ScraperConfiguration>;
  industries: Industry[];
  jobSources: JobSource[];
  onSubmit: (data: Partial<ScraperConfiguration>) => Promise<void>;
  isLoading?: boolean;
}

export const ScraperConfigurationForm = ({
  initialData,
  industries,
  jobSources,
  onSubmit,
  isLoading = false,
}: ScraperConfigurationFormProps) => {
  const [activeTab, setActiveTab] = useState("source");
  const [selectedSource, setSelectedSource] = useState<JobSource | null>(
    initialData?.source_id
      ? jobSources.find((s) => s.id === initialData.source_id) || null
      : null
  );
  
  const [keywords, setKeywords] = useState<string[]>(
    initialData?.keywords || []
  );
  const [newKeyword, setNewKeyword] = useState("");
  
  const [locations, setLocations] = useState<string[]>(
    initialData?.locations || []
  );
  const [newLocation, setNewLocation] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      source_id: initialData?.source_id || null,
      url: initialData?.url || null,
      frequency: initialData?.frequency || "daily",
      keywords: initialData?.keywords || [],
      locations: initialData?.locations || [],
      job_types: initialData?.job_types || [],
      industries: initialData?.industries || [],
      experience_levels: initialData?.experience_levels || [],
      salary_range: initialData?.salary_range || {
        min: null,
        max: null,
        currency: "USD",
      },
      is_active: initialData?.is_active !== false,
    },
  });

  const handleSourceSelect = (source: JobSource) => {
    setSelectedSource(source);
    form.setValue("source_id", source.id);
    
    // If it's a custom source, we need a URL
    if (source.type === "custom") {
      form.setValue("url", "");
    } else {
      form.setValue("url", null);
    }
  };

  const addKeyword = () => {
    if (!newKeyword.trim()) return;
    
    const updatedKeywords = [...keywords, newKeyword.trim()];
    setKeywords(updatedKeywords);
    form.setValue("keywords", updatedKeywords);
    setNewKeyword("");
  };

  const removeKeyword = (keyword: string) => {
    const updatedKeywords = keywords.filter(k => k !== keyword);
    setKeywords(updatedKeywords);
    form.setValue("keywords", updatedKeywords);
  };

  const addLocation = () => {
    if (!newLocation.trim()) return;
    
    const updatedLocations = [...locations, newLocation.trim()];
    setLocations(updatedLocations);
    form.setValue("locations", updatedLocations);
    setNewLocation("");
  };

  const removeLocation = (location: string) => {
    const updatedLocations = locations.filter(l => l !== location);
    setLocations(updatedLocations);
    form.setValue("locations", updatedLocations);
  };

  const onFormSubmit = (values: FormValues) => {
    // Ensure the salary_range is properly formatted
    const formattedData: Partial<ScraperConfiguration> = {
      ...values,
      keywords,
      locations,
      salary_range: values.salary_range ? {
        min: values.salary_range.min ?? null,
        max: values.salary_range.max ?? null,
        currency: values.salary_range.currency || "USD"
      } : undefined
    };
    
    onSubmit(formattedData);
  };

  const jobTypeOptions = [
    "Full-time",
    "Part-time",
    "Contract",
    "Temporary",
    "Internship",
    "Remote",
    "Freelance"
  ];

  const experienceLevelOptions = [
    "Entry Level",
    "Mid Level",
    "Senior Level",
    "Manager",
    "Director",
    "Executive"
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Configuration Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter a name for this configuration" {...field} />
                    </FormControl>
                    <FormDescription>
                      A descriptive name to identify this scraper
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Run Frequency</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      How often this scraper should run
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <FormDescription>
                        Enable or disable this scraper
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="source">Source</TabsTrigger>
            <TabsTrigger value="filters">Filters</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          
          <TabsContent value="source" className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <FormField
                  control={form.control}
                  name="source_id"
                  render={() => (
                    <FormItem>
                      <FormLabel>Job Source</FormLabel>
                      <FormControl>
                        <JobSourceSelector
                          jobSources={jobSources}
                          selectedSourceId={selectedSource?.id || null}
                          onSelect={handleSourceSelect}
                          isLoading={isLoading}
                        />
                      </FormControl>
                      <FormDescription>
                        Select the job board or platform to scrape
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {selectedSource?.type === "custom" && (
                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem className="mt-6">
                        <FormLabel>Custom URL</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://example.com/jobs" 
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter the URL to scrape for jobs
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="filters" className="space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-4">
                  <FormLabel>Keywords</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add keyword..."
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addKeyword();
                        }
                      }}
                    />
                    <Button type="button" onClick={addKeyword}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {keywords.map((keyword, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {keyword}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => removeKeyword(keyword)}
                        >
                          <span className="sr-only">Remove</span>
                          <span aria-hidden="true">×</span>
                        </Button>
                      </Badge>
                    ))}
                    {keywords.length === 0 && (
                      <span className="text-sm text-muted-foreground">
                        No keywords added
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <FormLabel>Locations</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add location..."
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addLocation();
                        }
                      }}
                    />
                    <Button type="button" onClick={addLocation}>
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {locations.map((location, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {location}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => removeLocation(location)}
                        >
                          <span className="sr-only">Remove</span>
                          <span aria-hidden="true">×</span>
                        </Button>
                      </Badge>
                    ))}
                    {locations.length === 0 && (
                      <span className="text-sm text-muted-foreground">
                        No locations added
                      </span>
                    )}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="job_types"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Types</FormLabel>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {jobTypeOptions.map((type) => (
                          <Badge
                            key={type}
                            variant={field.value?.includes(type) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => {
                              const current = field.value || [];
                              if (current.includes(type)) {
                                field.onChange(current.filter((t) => t !== type));
                              } else {
                                field.onChange([...current, type]);
                              }
                            }}
                          >
                            {type}
                          </Badge>
                        ))}
                      </div>
                      <FormDescription>
                        Select the job types you're interested in
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="industries"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industries</FormLabel>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {industries.map((industry) => (
                          <Badge
                            key={industry.id}
                            variant={field.value?.includes(industry.name) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => {
                              const current = field.value || [];
                              if (current.includes(industry.name)) {
                                field.onChange(current.filter((i) => i !== industry.name));
                              } else {
                                field.onChange([...current, industry.name]);
                              }
                            }}
                          >
                            {industry.name}
                          </Badge>
                        ))}
                      </div>
                      <FormDescription>
                        Select the industries you're interested in
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="experience_levels"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Experience Levels</FormLabel>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {experienceLevelOptions.map((level) => (
                          <Badge
                            key={level}
                            variant={field.value?.includes(level) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => {
                              const current = field.value || [];
                              if (current.includes(level)) {
                                field.onChange(current.filter((l) => l !== level));
                              } else {
                                field.onChange([...current, level]);
                              }
                            }}
                          >
                            {level}
                          </Badge>
                        ))}
                      </div>
                      <FormDescription>
                        Select the experience levels you're interested in
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-6">
                <FormField
                  control={form.control}
                  name="salary_range.min"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Salary</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Minimum salary" 
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormDescription>
                        Minimum salary to filter jobs (optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="salary_range.max"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Salary</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Maximum salary" 
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum salary to filter jobs (optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="salary_range.currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="CAD">CAD</SelectItem>
                          <SelectItem value="AUD">AUD</SelectItem>
                          <SelectItem value="JPY">JPY</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Currency for salary range
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-4">
          <Button type="submit" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span>{initialData ? "Update" : "Create"} Scraper</span>
          </Button>
        </div>
      </form>
    </Form>
  );
};
