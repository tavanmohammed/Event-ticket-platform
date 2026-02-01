import * as React from "react";
import NavBar from "@/components/nav-bar";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import {
  CreateEventRequest,
  CreateTicketTypeRequest,
  EventDetails,
  EventStatusEnum,
  UpdateEventRequest,
  UpdateTicketTypeRequest,
} from "@/domain/domain";
import { createEvent, getEvent, updateEvent } from "@/lib/api";

import { format } from "date-fns";
import { AlertCircle, CalendarIcon, Edit, Plus, Ticket, Trash } from "lucide-react";
import { useAuth } from "react-oidc-context";
import { useNavigate, useParams } from "react-router";

// IMPORTANT: Make sure this is loaded somewhere globally (main.tsx or global css):
// import "react-day-picker/dist/style.css";

/* ----------------------------- Small helpers ----------------------------- */

const generateTempId = () => `temp_${crypto.randomUUID()}`;
const isTempId = (id: string | undefined) => !!id && id.startsWith("temp_");

function toDateOrUndefined(value: unknown): Date | undefined {
  if (!value) return undefined;
  const d = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function formatTimeFromDate(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Combine date + "HH:mm" -> UTC Date (safe to send to backend)
 */
function combineDateTimeToUTC(date: Date, time: string): Date {
  const [hh, mm] = time.split(":").map((n) => Number.parseInt(n, 10));
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), hh, mm, 0, 0));
}

/* ------------------------------ Local types ------------------------------ */

interface TicketTypeData {
  id: string | undefined;
  name: string;
  price: number;
  totalAvailable?: number;
  description: string;
}

interface EventData {
  id: string | undefined;
  name: string;
  startDate: Date | undefined;
  startTime: string;
  endDate: Date | undefined;
  endTime: string;
  venueDetails: string;
  salesStartDate: Date | undefined;
  salesStartTime: string;
  salesEndDate: Date | undefined;
  salesEndTime: string;
  ticketTypes: TicketTypeData[];
  status: EventStatusEnum;
  createdAt: Date | undefined;
  updatedAt: Date | undefined;
}

interface DateTimeSelectProps {
  date: Date | undefined;
  setDate: (d: Date | undefined) => void;
  time: string;
  setTime: (t: string) => void;
  enabled: boolean;
  setEnabled: (b: boolean) => void;
}

/* --------------------------- DateTimeSelect UI --------------------------- */
/**
 * This one is "hard mode safe":
 * - Button is type="button" so it never submits the form.
 * - We control Popover open state so it doesn't instantly close.
 * - We force PopoverContent z-index + background so it's visible.
 */
const DateTimeSelect: React.FC<DateTimeSelectProps> = ({
  date,
  setDate,
  time,
  setTime,
  enabled,
  setEnabled,
}) => {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="flex gap-2 items-center">
      <Switch checked={enabled} onCheckedChange={setEnabled} />

      {enabled && (
        <div className="w-full flex gap-2 items-center">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                className="bg-gray-900 border-gray-700 border text-white hover:bg-gray-800"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpen(true);
                }}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>

            <PopoverContent
              className="z-[9999] w-auto p-2 bg-gray-900 border border-gray-700 text-white"
              side="bottom"
              align="start"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => {
                  setDate(d);
                  setOpen(false);
                }}
                initialFocus
                className="rounded-md"
              />
            </PopoverContent>
          </Popover>

          <Input
            type="time"
            className="w-[110px] bg-gray-900 text-white border-gray-700 border [&::-webkit-calendar-picker-indicator]:invert"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />

          <Button
            type="button"
            variant="ghost"
            className="text-gray-300 hover:text-white"
            onClick={() => {
              setDate(undefined);
              setTime("");
            }}
          >
            Clear
          </Button>
        </div>
      )}
    </div>
  );
};

/* ---------------------------- Main page component ---------------------------- */

const DashboardManageEventPage: React.FC = () => {
  const { isLoading, user } = useAuth();
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();

  const [eventData, setEventData] = React.useState<EventData>({
    id: undefined,
    name: "",
    startDate: undefined,
    startTime: "",
    endDate: undefined,
    endTime: "",
    venueDetails: "",
    salesStartDate: undefined,
    salesStartTime: "",
    salesEndDate: undefined,
    salesEndTime: "",
    ticketTypes: [],
    status: EventStatusEnum.DRAFT,
    createdAt: undefined,
    updatedAt: undefined,
  });

  const [currentTicketType, setCurrentTicketType] = React.useState<TicketTypeData | undefined>();
  const [dialogOpen, setDialogOpen] = React.useState(false);

  // Enable by default (you can change this)
  const [eventDateEnabled, setEventDateEnabled] = React.useState(true);
  const [eventSalesDateEnabled, setEventSalesDateEnabled] = React.useState(true);

  const [error, setError] = React.useState<string | undefined>();

  const updateField = <K extends keyof EventData>(field: K, value: EventData[K]) => {
    setEventData((prev) => ({ ...prev, [field]: value }));
  };

  React.useEffect(() => {
    if (!isEditMode) return;
    if (isLoading) return;
    if (!user?.access_token) return;

    (async () => {
      try {
        const event: EventDetails = await getEvent(user.access_token, id);

        const start = toDateOrUndefined(event.start);
        const end = toDateOrUndefined(event.end);
        const salesStart = toDateOrUndefined(event.salesStart);
        const salesEnd = toDateOrUndefined(event.salesEnd);

        setEventData({
          id: event.id,
          name: event.name ?? "",
          startDate: start,
          startTime: start ? formatTimeFromDate(start) : "",
          endDate: end,
          endTime: end ? formatTimeFromDate(end) : "",
          venueDetails: event.venue ?? "",
          salesStartDate: salesStart,
          salesStartTime: salesStart ? formatTimeFromDate(salesStart) : "",
          salesEndDate: salesEnd,
          salesEndTime: salesEnd ? formatTimeFromDate(salesEnd) : "",
          status: event.status,
          ticketTypes: (event.ticketTypes ?? []).map((t) => ({
            id: t.id,
            name: t.name ?? "",
            description: t.description ?? "",
            price: Number(t.price ?? 0),
            totalAvailable: t.totalAvailable ?? 0,
          })),
          createdAt: toDateOrUndefined(event.createdAt),
          updatedAt: toDateOrUndefined(event.updatedAt),
        });

        setEventDateEnabled(!!(start || end));
        setEventSalesDateEnabled(!!(salesStart || salesEnd));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load event");
      }
    })();
  }, [id, isEditMode, isLoading, user?.access_token]);

  const handleAddTicketType = () => {
    setCurrentTicketType({
      id: undefined,
      name: "",
      price: 0,
      totalAvailable: 0,
      description: "",
    });
    setDialogOpen(true);
  };

  const handleEditTicketType = (ticketType: TicketTypeData) => {
    setCurrentTicketType(ticketType);
    setDialogOpen(true);
  };

  const handleDeleteTicketType = (ticketId: string | undefined) => {
    if (!ticketId) return;
    updateField(
      "ticketTypes",
      eventData.ticketTypes.filter((t) => t.id !== ticketId),
    );
  };

  const handleSaveTicketType = () => {
    if (!currentTicketType) return;

    setEventData((prev) => {
      const next = [...prev.ticketTypes];

      if (currentTicketType.id) {
        const idx = next.findIndex((t) => t.id === currentTicketType.id);
        if (idx !== -1) next[idx] = currentTicketType;
      } else {
        next.push({ ...currentTicketType, id: generateTempId() });
      }

      return { ...prev, ticketTypes: next };
    });

    setDialogOpen(false);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);

    if (isLoading || !user?.access_token) {
      setError("Not authenticated");
      return;
    }

    const accessToken = user.access_token;

    const start =
      eventDateEnabled && eventData.startDate && eventData.startTime
        ? combineDateTimeToUTC(eventData.startDate, eventData.startTime)
        : undefined;

    const end =
      eventDateEnabled && eventData.endDate && eventData.endTime
        ? combineDateTimeToUTC(eventData.endDate, eventData.endTime)
        : undefined;

    const salesStart =
      eventSalesDateEnabled && eventData.salesStartDate && eventData.salesStartTime
        ? combineDateTimeToUTC(eventData.salesStartDate, eventData.salesStartTime)
        : undefined;

    const salesEnd =
      eventSalesDateEnabled && eventData.salesEndDate && eventData.salesEndTime
        ? combineDateTimeToUTC(eventData.salesEndDate, eventData.salesEndTime)
        : undefined;

    try {
      if (isEditMode) {
        if (!eventData.id) throw new Error("Event does not have an ID");

        const ticketTypes: UpdateTicketTypeRequest[] = eventData.ticketTypes.map((t) => ({
          id: isTempId(t.id) ? undefined : t.id,
          name: t.name,
          price: t.price,
          description: t.description,
          totalAvailable: t.totalAvailable,
        }));

        const request: UpdateEventRequest = {
          id: eventData.id,
          name: eventData.name,
          start,
          end,
          venue: eventData.venueDetails,
          salesStart,
          salesEnd,
          status: eventData.status,
          ticketTypes,
        };

        await updateEvent(accessToken, eventData.id, request);
      } else {
        const ticketTypes: CreateTicketTypeRequest[] = eventData.ticketTypes.map((t) => ({
          name: t.name,
          price: t.price,
          description: t.description,
          totalAvailable: t.totalAvailable,
        }));

        const request: CreateEventRequest = {
          name: eventData.name,
          start,
          end,
          venue: eventData.venueDetails,
          salesStart,
          salesEnd,
          status: eventData.status,
          ticketTypes,
        };

        await createEvent(accessToken, request);
      }

      navigate("/dashboard/events");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <NavBar />

      <div className="container mx-auto px-4 py-8 max-w-xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{isEditMode ? "Edit Event" : "Create a New Event"}</h1>

          {isEditMode ? (
            <>
              {eventData.id && <p className="text-sm text-gray-400">ID: {eventData.id}</p>}
              {eventData.createdAt && (
                <p className="text-sm text-gray-400">Created At: {format(eventData.createdAt, "PPP")}</p>
              )}
              {eventData.updatedAt && (
                <p className="text-sm text-gray-400">Updated At: {format(eventData.updatedAt, "PPP")}</p>
              )}
            </>
          ) : (
            <p className="text-gray-400">Fill out the form below to create your event.</p>
          )}
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-5">
          {/* Event Name */}
          <div className="space-y-2">
            <Label htmlFor="event-name" className="text-sm font-medium">
              Event Name
            </Label>
            <Input
              id="event-name"
              className="bg-gray-900 border-gray-700 text-white"
              placeholder="Event Name"
              value={eventData.name}
              onChange={(e) => updateField("name", e.target.value)}
              required
            />
            <p className="text-gray-400 text-xs">This is the public name of your event.</p>
          </div>

          {/* Event Start */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Event Start</Label>
            <DateTimeSelect
              date={eventData.startDate}
              setDate={(d) => updateField("startDate", d)}
              time={eventData.startTime}
              setTime={(t) => updateField("startTime", t)}
              enabled={eventDateEnabled}
              setEnabled={setEventDateEnabled}
            />
            <p className="text-gray-400 text-xs">The date and time that the event starts.</p>
          </div>

          {/* Event End */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Event End</Label>
            <DateTimeSelect
              date={eventData.endDate}
              setDate={(d) => updateField("endDate", d)}
              time={eventData.endTime}
              setTime={(t) => updateField("endTime", t)}
              enabled={eventDateEnabled}
              setEnabled={setEventDateEnabled}
            />
            <p className="text-gray-400 text-xs">The date and time that the event ends.</p>
          </div>

          {/* Venue */}
          <div className="space-y-2">
            <Label htmlFor="venue-details" className="text-sm font-medium">
              Venue Details
            </Label>
            <Textarea
              id="venue-details"
              className="bg-gray-900 border-gray-700 min-h-[100px]"
              value={eventData.venueDetails}
              onChange={(e) => updateField("venueDetails", e.target.value)}
            />
            <p className="text-gray-400 text-xs">
              Details about the venue, please include as much detail as possible.
            </p>
          </div>

          {/* Sales Start */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Event Sales Start</Label>
            <DateTimeSelect
              date={eventData.salesStartDate}
              setDate={(d) => updateField("salesStartDate", d)}
              time={eventData.salesStartTime}
              setTime={(t) => updateField("salesStartTime", t)}
              enabled={eventSalesDateEnabled}
              setEnabled={setEventSalesDateEnabled}
            />
            <p className="text-gray-400 text-xs">
              The date and time that tickets are available to purchase for the event.
            </p>
          </div>

          {/* Sales End */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Event Sales End</Label>
            <DateTimeSelect
              date={eventData.salesEndDate}
              setDate={(d) => updateField("salesEndDate", d)}
              time={eventData.salesEndTime}
              setTime={(t) => updateField("salesEndTime", t)}
              enabled={eventSalesDateEnabled}
              setEnabled={setEventSalesDateEnabled}
            />
            <p className="text-gray-400 text-xs">
              The date and time that tickets are available to purchase for the event.
            </p>
          </div>

          {/* Ticket Types */}
          <div>
            <Card className="bg-gray-900 border-gray-700 text-white">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex gap-2 items-center text-sm">
                      <Ticket className="h-4 w-4" />
                      Ticket Types
                    </CardTitle>

                    <Button
                      type="button"
                      onClick={handleAddTicketType}
                      className="bg-gray-800 border-gray-700 text-white"
                    >
                      <Plus className="h-4 w-4" /> Add Ticket Type
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-2">
                  {eventData.ticketTypes.length === 0 ? (
                    <p className="text-sm text-gray-400">No ticket types yet.</p>
                  ) : (
                    eventData.ticketTypes.map((ticketType) => (
                      <div
                        key={ticketType.id ?? ticketType.name}
                        className="bg-gray-800 w-full p-4 rounded-lg border border-gray-700"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="flex gap-4 items-center">
                              <p className="text-sm font-medium">{ticketType.name}</p>
                              <Badge
                                variant="outline"
                                className="border-gray-600 text-white font-normal text-xs"
                              >
                                ${ticketType.price}
                              </Badge>
                            </div>
                            {!!ticketType.totalAvailable && (
                              <p className="text-gray-400 text-sm">
                                {ticketType.totalAvailable} tickets available
                              </p>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => handleEditTicketType(ticketType)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              className="text-red-400"
                              onClick={() => handleDeleteTicketType(ticketType.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>

                <DialogContent className="bg-gray-900 border-gray-700 text-white">
                  <DialogHeader>
                    <DialogTitle>{currentTicketType?.id ? "Edit Ticket Type" : "Add Ticket Type"}</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Please enter details of the ticket type
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-2">
                    <Label htmlFor="ticket-type-name">Name</Label>
                    <Input
                      id="ticket-type-name"
                      className="bg-gray-800 border-gray-700"
                      value={currentTicketType?.name ?? ""}
                      onChange={(e) =>
                        setCurrentTicketType((prev) =>
                          prev ? { ...prev, name: e.target.value } : prev,
                        )
                      }
                      placeholder="e.g General Admission, VIP, etc."
                    />
                  </div>

                  <div className="flex gap-4">
                    <div className="space-y-2 w-full">
                      <Label htmlFor="ticket-type-price">Price</Label>
                      <Input
                        id="ticket-type-price"
                        type="number"
                        value={currentTicketType?.price ?? 0}
                        onChange={(e) =>
                          setCurrentTicketType((prev) =>
                            prev
                              ? { ...prev, price: Number.parseFloat(e.target.value || "0") }
                              : prev,
                          )
                        }
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>

                    <div className="space-y-2 w-full">
                      <Label htmlFor="ticket-type-total-available">Total Available</Label>
                      <Input
                        id="ticket-type-total-available"
                        type="number"
                        value={currentTicketType?.totalAvailable ?? 0}
                        onChange={(e) =>
                          setCurrentTicketType((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  totalAvailable: Number.parseFloat(e.target.value || "0"),
                                }
                              : prev,
                          )
                        }
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ticket-type-description">Description</Label>
                    <Textarea
                      id="ticket-type-description"
                      className="bg-gray-800 border-gray-700"
                      value={currentTicketType?.description ?? ""}
                      onChange={(e) =>
                        setCurrentTicketType((prev) =>
                          prev ? { ...prev, description: e.target.value } : prev,
                        )
                      }
                    />
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      className="bg-white text-black hover:bg-gray-300"
                      onClick={handleSaveTicketType}
                    >
                      Save
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </Card>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={eventData.status}
              onValueChange={(value) => updateField("status", value as EventStatusEnum)}
            >
              <SelectTrigger className="w-[180px] bg-gray-900 border-gray-700 text-white">
                <SelectValue placeholder="Select Event Status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700 text-white">
                <SelectItem value={EventStatusEnum.DRAFT}>Draft</SelectItem>
                <SelectItem value={EventStatusEnum.PUBLISHED}>Published</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-gray-400 text-xs">Please select the status of the event.</p>
          </div>

          {error && (
            <Alert variant="destructive" className="bg-gray-900 border-red-700">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <Button type="submit" className="bg-white text-black hover:bg-gray-200">
              {isEditMode ? "Update" : "Submit"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DashboardManageEventPage;
