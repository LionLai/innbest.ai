"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { HotelProperty } from "@/lib/types/hotel";

interface HotelPropertyCardProps {
  property: HotelProperty;
}

export function HotelPropertyCard({ property }: HotelPropertyCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl">{property.name}</CardTitle>
            <CardDescription className="mt-2">
              <div className="flex flex-wrap items-center gap-2">
                {(property.city || property.address || property.country) && (
                  <span className="flex items-center gap-1">
                    📍 {[property.address, property.city, property.country].filter(Boolean).join(', ')}
                  </span>
                )}
                {property.propertyType && (
                  <Badge variant="outline">
                    {property.propertyType}
                  </Badge>
                )}
              </div>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-3 text-sm text-muted-foreground">
              房型選擇 ({property.roomTypes.length})
            </h4>
            <div className="space-y-2">
              {property.roomTypes.length > 0 ? (
                property.roomTypes.map((room) => (
                  <div
                    key={room.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-lg">{room.name}</div>
                      <div className="text-sm text-muted-foreground mt-2 flex flex-wrap gap-3 items-center">
                        {room.roomType && (
                          <Badge variant="secondary" className="mr-1">
                            {room.roomType}
                          </Badge>
                        )}
                        {room.maxPeople && (
                          <span className="flex items-center gap-1">
                            👥 最多入住 {room.maxPeople} 人
                          </span>
                        )}
                        {room.qty && room.qty > 0 && (
                          <span className="flex items-center gap-1">
                            🏠 {room.qty} 間
                          </span>
                        )}
                      </div>
                    </div>
                    {room.minPrice && (
                      <div className="text-right ml-4">
                        <div className="text-sm text-muted-foreground">每晚起</div>
                        <div className="text-2xl font-bold text-primary">
                          {property.currency || '$'} {room.minPrice.toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground text-center py-8">
                  此飯店目前沒有可預訂的房型
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

