FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and restore dependencies
COPY . .
RUN dotnet restore "FarmGear_Application/FarmGear_Application.csproj"

# Publish application
RUN dotnet publish "FarmGear_Application/FarmGear_Application.csproj" -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Expose port (must match docker-compose.yml, HTTPS 8443)
ENV ASPNETCORE_URLS=https://+:8443
EXPOSE 8443

ENTRYPOINT ["dotnet", "FarmGear_Application.dll"]
