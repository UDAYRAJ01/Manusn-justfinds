export function hasValidCoordinates(latitude: string, longitude: string) {
  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);
  return latitude.trim() !== "" && longitude.trim() !== "" && Number.isFinite(parsedLatitude) && Number.isFinite(parsedLongitude) && Math.abs(parsedLatitude) <= 90 && Math.abs(parsedLongitude) <= 180;
}

export function isApprovalReadyDescription(description: string) {
  const length = description.trim().length;
  return length >= 40 && length <= 1000;
}
