import React, { useState, useEffect } from "react";
import { useRegisteredEvents } from "../hooks/useRegisteredEvents";
import { useDeleteEvent } from "../hooks/useDeleteEvent";
import { Link } from "../components/Link";
import { Event } from "../types";

const RegisteredEvents: React.FC = () => {
  const { events, loading, error, refreshEvents, clearError } =
    useRegisteredEvents();
  const { deleteEvent, loading: deleting, error: deleteError, clearError: clearDeleteError } =
    useDeleteEvent();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterByState, setFilterByState] = useState<string>("all");
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState<string | null>(null);

  // Filter events based on search term and state
  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.team_owner.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesState =
      filterByState === "all" || event.state === filterByState;

    return matchesSearch && matchesState;
  });

  const handleRefresh = () => {
    clearError();
    refreshEvents();
  };

  const handleViewJson = (event: Event) => {
    setSelectedEvent(event);
    setShowJsonModal(true);
  };

  const handleDeleteClick = (event: Event) => {
    setEventToDelete(event);
  };

  const handleConfirmDelete = async () => {
    if (!eventToDelete || !eventToDelete.id) {
      return;
    }

    const success = await deleteEvent(eventToDelete.id);
    if (success) {
      const eventName = eventToDelete.name;
      setEventToDelete(null);
      setDeleteSuccessMessage(`Event "${eventName}" has been deleted successfully!`);
      // Reload the event list after deleting
      refreshEvents();
    }
  };

  const handleCancelDelete = () => {
    setEventToDelete(null);
    clearDeleteError();
  };

  const clearDeleteSuccess = () => {
    setDeleteSuccessMessage(null);
  };

  // Clear success message automatically after 5 seconds
  useEffect(() => {
    if (deleteSuccessMessage) {
      const timer = setTimeout(() => {
        setDeleteSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [deleteSuccessMessage]);

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

      {/* Delete Error Message */}
      {deleteError && (
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
              <span className="text-red-200">{deleteError}</span>
            </div>
            <button
              onClick={clearDeleteError}
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

      {/* Delete Success Message */}
      {deleteSuccessMessage && (
        <div className="bg-green-900 border border-green-700 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-green-200">{deleteSuccessMessage}</span>
            </div>
            <button
              onClick={clearDeleteSuccess}
              className="text-green-400 hover:text-green-300"
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
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, service or team..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
              {searchTerm || filterByState !== "all"
                ? "No events found with the applied filters"
                : "No registered events found"}
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
                  <h3 className="text-xl font-semibold">{event.name}</h3>
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
                    onClick={() => handleViewJson(event)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                  >
                    View JSON
                  </button>
                  {event.id && (
                    <button
                      onClick={() => handleDeleteClick(event)}
                      disabled={deleting}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm flex items-center gap-1"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Delete
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm mb-4">
                <div>
                  <span className="text-gray-400">Service: </span>
                  <span className="text-white">{event.service_name}</span>
                </div>
                <div>
                  <span className="text-gray-400">Team: </span>
                  <span className="text-white">{event.team_owner}</span>
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
                              {trigger.option.wq_type}
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

      {/* JSON Modal */}
      {showJsonModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h3 className="text-lg font-semibold">
                Event JSON: {selectedEvent.name}
              </h3>
              <button
                onClick={() => setShowJsonModal(false)}
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
            <div className="p-6 overflow-auto max-h-[60vh]">
              <pre className="bg-gray-900 p-4 rounded text-sm overflow-auto">
                <code className="text-green-400">
                  {JSON.stringify(selectedEvent, null, 2)}
                </code>
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {eventToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-red-400">
                Confirm Deletion
              </h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete the event{" "}
                <span className="font-semibold text-white">
                  {eventToDelete.name}
                </span>
                ? This action cannot be undone.
              </p>
              {deleteError && (
                <div className="bg-red-900 border border-red-700 rounded-lg p-3 mb-4">
                  <span className="text-red-200 text-sm">{deleteError}</span>
                </div>
              )}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCancelDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm font-medium flex items-center gap-2"
                >
                  {deleting && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  {deleting ? "Deleting..." : "Delete"}
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
