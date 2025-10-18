import React, { useState, useRef, useEffect } from "react";
import { useRegisteredEvents } from "../hooks/useRegisteredEvents";
import { useUpdateEvent } from "../hooks/useUpdateEvent";
import { useDeleteEvent } from "../hooks/useDeleteEvent";
import { Link } from "../components/Link";
import { Event } from "../types";

const RegisteredEvents: React.FC = () => {
  const { events, loading, error, refreshEvents, clearError } =
    useRegisteredEvents();
  const {
    updateEvent,
    loading: updating,
    error: updateError,
    clearError: clearUpdateError,
  } = useUpdateEvent();
  const {
    deleteEvent,
    loading: deleting,
    error: deleteError,
    clearError: clearDeleteError,
  } = useDeleteEvent();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonContent, setJsonContent] = useState<string>("");
  const [jsonFormatError, setJsonFormatError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterByState, setFilterByState] = useState<string>("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filtrar eventos baseado no termo de busca e estado
  const filteredEvents = events.filter((event) => {
    // Verificações de segurança para evitar erros com valores null/undefined
    const eventName = event.name?.toLowerCase() || "";
    const serviceName = event.service_name?.toLowerCase() || "";
    const teamOwner = event.team_owner?.toLowerCase() || "";
    const eventType = event.type_event?.toString() || "";
    const searchTermLower = searchTerm.toLowerCase().trim();

    // Debug: Log do evento sendo filtrado (apenas quando há busca)
    if (searchTermLower && process.env.NODE_ENV === "development") {
      console.log("Filtering event:", {
        name: eventName,
        service: serviceName,
        team: teamOwner,
        type: eventType,
        searchTerm: searchTermLower,
      });
    }

    // Buscar também nos triggers
    const triggerMatches =
      event.triggers?.some((trigger) => {
        const triggerService = trigger.service_name?.toLowerCase() || "";
        const triggerType = trigger.type?.toLowerCase() || "";
        const triggerHost = trigger.host?.toLowerCase() || "";
        const triggerPath = trigger.path?.toLowerCase() || "";

        const matches =
          triggerService.includes(searchTermLower) ||
          triggerType.includes(searchTermLower) ||
          triggerHost.includes(searchTermLower) ||
          triggerPath.includes(searchTermLower);

        if (
          matches &&
          searchTermLower &&
          process.env.NODE_ENV === "development"
        ) {
          console.log("Trigger match found:", {
            triggerService,
            triggerType,
            triggerHost,
            triggerPath,
            searchTerm: searchTermLower,
          });
        }

        return matches;
      }) || false;

    // Se não há termo de busca, considera como match
    const matchesSearch =
      !searchTermLower ||
      eventName.includes(searchTermLower) ||
      serviceName.includes(searchTermLower) ||
      teamOwner.includes(searchTermLower) ||
      eventType.includes(searchTermLower) ||
      triggerMatches;

    // Filtro por estado
    const matchesState =
      filterByState === "all" || event.state === filterByState;

    const finalMatch = matchesSearch && matchesState;

    // Debug: Log resultado final
    if (searchTermLower && process.env.NODE_ENV === "development") {
      console.log(
        `Event "${eventName}" ${finalMatch ? "MATCHES" : "DOES NOT MATCH"} search criteria`,
      );
    }

    return finalMatch;
  });

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+K para focar na busca
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
      // Escape para limpar busca se estiver focada
      if (
        event.key === "Escape" &&
        document.activeElement === searchInputRef.current
      ) {
        setSearchTerm("");
        searchInputRef.current?.blur();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Função para destacar termos de busca no texto
  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;

    const regex = new RegExp(
      `(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi",
    );
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <span
          key={index}
          className="bg-yellow-600 text-yellow-100 px-1 rounded"
        >
          {part}
        </span>
      ) : (
        part
      ),
    );
  };

  const handleRefresh = () => {
    clearError();
    refreshEvents();
  };

  const handleEditJson = (event: Event) => {
    setSelectedEvent(event);
    setJsonContent(JSON.stringify(event, null, 2));
    setShowJsonModal(true);
  };

  const handleDeleteClick = (event: Event) => {
    setEventToDelete(event);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!eventToDelete?.id) return;

    const success = await deleteEvent(eventToDelete.id);
    if (success) {
      setShowDeleteModal(false);
      setEventToDelete(null);
      refreshEvents();
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setEventToDelete(null);
    clearDeleteError();
  };

  const handleSaveJson = async () => {
    if (!selectedEvent) return;

    try {
      const parsedEvent = JSON.parse(jsonContent);
      setJsonFormatError(null);
      const success = await updateEvent(selectedEvent.id!, parsedEvent);
      if (success) {
        setShowJsonModal(false);
        refreshEvents();
      }
    } catch (err) {
      console.error("Invalid JSON format:", err);
      setJsonFormatError(
        "Invalid JSON. Please fix syntax errors before submitting.",
      );
    }
  };

  const handleFormatJson = () => {
    try {
      const parsedJson = JSON.parse(jsonContent);
      setJsonContent(JSON.stringify(parsedJson, null, 2));
      setJsonFormatError(null);
    } catch (err) {
      console.error("Invalid JSON format:", err);
      setJsonFormatError(
        "Invalid JSON. Please check the syntax before formatting.",
      );
    }
  };

  const handleCloseModal = () => {
    setShowJsonModal(false);
    setJsonFormatError(null);
    clearUpdateError();
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case "active":
        return "bg-green-600 text-green-100";
      case "inactive":
        return "bg-red-600 text-red-100";
      case "paused":
        return "bg-yellow-600 text-yellow-100";
      default:
        return "bg-gray-600 text-gray-100";
    }
  };

  const getTriggerTypeColor = (type: string) => {
    switch (type) {
      case "persistent":
        return "bg-blue-600 text-blue-100";
      case "immediate":
        return "bg-purple-600 text-purple-100";
      default:
        return "bg-gray-600 text-gray-100";
    }
  };

  const formatRetention = (retention: string) => {
    // Convert format "168h0m0s" to something more readable
    if (retention.includes("h")) {
      const hours = parseInt(retention.split("h")[0]);
      if (hours >= 24) {
        return `${hours / 24} days`;
      }
      return `${hours} hours`;
    }
    return retention;
  };

  const formatDuration = (duration: string) => {
    if (duration.includes("m") && duration.includes("s")) {
      return duration.replace("m", " min ").replace("s", " sec");
    }
    return duration;
  };

  if (loading && events.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading registered events...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="text-blue-400 hover:text-blue-300 text-sm mr-4"
          >
            ← Back to Home
          </Link>
          <h1 className="text-2xl font-bold">Registered Events</h1>
          {!loading && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-green-400 text-sm">
                {events.length} event{events.length !== 1 ? "s" : ""} loaded
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-md text-sm font-medium"
          >
            <svg
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900 border border-red-700 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-red-200">{error}</span>
            </div>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-300"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by name, service, team, type, triggers... (Ctrl+K)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setSearchTerm("");
                  e.currentTarget.blur();
                }
              }}
              className="w-full px-4 py-2 pr-10 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                title="Clear search"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
          <div className="flex gap-4">
            <select
              value={filterByState}
              onChange={(e) => setFilterByState(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All states</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="paused">Paused</option>
            </select>
          </div>
        </div>

        {/* Results Counter */}
        {events.length > 0 && (
          <div className="text-sm text-gray-400 mt-4 flex justify-between items-center">
            <div>
              {searchTerm || filterByState !== "all" ? (
                <>
                  Showing{" "}
                  <span className="text-blue-400 font-medium">
                    {filteredEvents.length}
                  </span>{" "}
                  of <span className="text-white">{events.length}</span> events
                  {searchTerm && (
                    <span>
                      {" "}
                      matching "
                      <span className="text-yellow-400">{searchTerm}</span>"
                    </span>
                  )}
                  {filterByState !== "all" && (
                    <span>
                      {" "}
                      with state "
                      <span className="text-green-400">{filterByState}</span>"
                    </span>
                  )}
                </>
              ) : (
                `${events.length} events total`
              )}
            </div>
            {(searchTerm || filterByState !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterByState("all");
                }}
                className="text-xs text-gray-500 hover:text-gray-300 underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {filteredEvents.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-16 h-16 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m0 0v5a2 2 0 002 2h8a2 2 0 002-2v-5m-6 0V9a2 2 0 00-2-2H8a2 2 0 00-2 2v4m4 0v2"
                />
              </svg>
              {searchTerm || filterByState !== "all" ? (
                <>
                  <div className="text-lg font-medium mb-2">
                    No events found matching your criteria
                  </div>
                  {searchTerm && (
                    <div className="text-sm mt-2">
                      Search term: "
                      <span className="text-yellow-400 font-medium">
                        {searchTerm}
                      </span>
                      "
                    </div>
                  )}
                  {filterByState !== "all" && (
                    <div className="text-sm mt-1">
                      State filter:{" "}
                      <span className="text-green-400 font-medium">
                        {filterByState}
                      </span>
                    </div>
                  )}
                  <div className="text-xs mt-4 text-gray-500">
                    Search includes: event name, service name, team owner, event
                    type, and trigger details
                  </div>
                </>
              ) : (
                <>
                  <div className="text-lg font-medium mb-2">
                    No registered events found
                  </div>
                  <div className="text-sm text-gray-500">
                    {loading
                      ? "Loading events..."
                      : "No events have been registered yet"}
                  </div>
                </>
              )}
            </div>
            {(searchTerm || filterByState !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterByState("all");
                }}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div key={event.id} className="bg-gray-800 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold">
                    {highlightSearchTerm(event.name, searchTerm)}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${getStateColor(event.state)}`}
                  >
                    {event.state}
                  </span>
                  <span className="px-2 py-1 rounded text-xs font-medium bg-gray-600 text-gray-100">
                    type: {event.type_event}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditJson(event)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                  >
                    Edit JSON
                  </button>
                  <button
                    onClick={() => handleDeleteClick(event)}
                    disabled={deleting}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed rounded text-sm"
                  >
                    {deleting && eventToDelete?.id === event.id
                      ? "Deletando..."
                      : "Delete"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm mb-4">
                <div>
                  <span className="text-gray-400">Service: </span>
                  <span className="text-white">
                    {highlightSearchTerm(event.service_name, searchTerm)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Team: </span>
                  <span className="text-white">
                    {highlightSearchTerm(event.team_owner, searchTerm)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Repository: </span>
                  <a
                    href={event.repo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    {event.repo_url}
                  </a>
                </div>
              </div>

              {/* Triggers */}
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-3">
                  Triggers ({event.triggers.length})
                </h4>
                <div className="space-y-3">
                  {event.triggers.map((trigger, index) => (
                    <div key={index} className="bg-gray-700 rounded p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="font-medium">
                          {trigger.service_name}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getTriggerTypeColor(trigger.type)}`}
                        >
                          {trigger.type}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="mb-2">
                            <span className="text-gray-400">Endpoint: </span>
                            <span className="text-white">
                              {trigger.host}
                              {trigger.path}
                            </span>
                          </div>
                          <div className="mb-2">
                            <span className="text-gray-400">Max Retries: </span>
                            <span className="text-white">
                              {trigger.option.max_retries}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">Queue Type: </span>
                            <span className="text-white">
                              {trigger.option.queue_type}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="mb-2">
                            <span className="text-gray-400">Retention: </span>
                            <span className="text-white">
                              {formatRetention(trigger.option.retention)}
                            </span>
                          </div>
                          <div className="mb-2">
                            <span className="text-gray-400">Unique TTL: </span>
                            <span className="text-white">
                              {formatDuration(trigger.option.unique_ttl)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">Schedule In: </span>
                            <span className="text-white">
                              {trigger.option.schedule_in || "0s"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* JSON Edit Modal */}
      {showJsonModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h3 className="text-lg font-semibold">
                Edit Event JSON: {selectedEvent.name}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-white"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Error Message */}
            {updateError && (
              <div className="mx-6 mt-4 bg-red-900 border border-red-700 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-red-200 text-sm">{updateError}</span>
                  <button
                    onClick={clearUpdateError}
                    className="text-red-400 hover:text-red-300"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            <div className="p-6 flex-1 overflow-hidden flex flex-col">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  JSON Content
                </label>
                <textarea
                  value={jsonContent}
                  onChange={(e) => {
                    setJsonContent(e.target.value);
                    setJsonFormatError(null);
                  }}
                  className="w-full h-96 p-4 bg-gray-900 border border-gray-600 rounded-md text-green-400 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter JSON content here..."
                />
                {jsonFormatError && (
                  <div className="mt-2 text-red-400 text-sm flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {jsonFormatError}
                  </div>
                )}
              </div>

              <div className="flex justify-between mt-4">
                <button
                  onClick={handleFormatJson}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-md text-sm font-medium flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Format JSON
                </button>

                <div className="flex gap-3">
                  <button
                    onClick={handleCloseModal}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveJson}
                    disabled={updating}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-md text-sm font-medium flex items-center gap-2"
                  >
                    {updating && (
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    )}
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && eventToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-white">
                    Confirmar Exclusão
                  </h3>
                  <p className="text-sm text-gray-300">
                    Esta ação não pode ser desfeita.
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-300">
                  Tem certeza que deseja excluir o evento{" "}
                  <span className="font-semibold text-white">
                    {eventToDelete.name}
                  </span>
                  ?
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Serviço: {eventToDelete.service_name} | Team:{" "}
                  {eventToDelete.team_owner}
                </p>
              </div>

              {deleteError && (
                <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-100">
                  {deleteError}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCancelDelete}
                  disabled={deleting}
                  className="px-4 py-2 text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white rounded flex items-center gap-2"
                >
                  {deleting && (
                    <svg
                      className="animate-spin -ml-1 mr-1 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  )}
                  {deleting ? "Excluindo..." : "Excluir"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisteredEvents;
