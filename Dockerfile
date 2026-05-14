# Use the official .NET 9 SDK image to build the application
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /app

# Copy the solution and project files
COPY *.sln .
COPY *.csproj .

# Restore dependencies
RUN dotnet restore northwind-traders.sln

# Copy the rest of the application source code
COPY . .

# Publish the application for release
RUN dotnet publish Northwind.csproj -c Release -o out

# Use the official .NET 9 ASP.NET runtime image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

# Copy the published application from the build stage
COPY --from=build /app/out .

# This is the crucial line for .NET 8/9
ENV ASPNETCORE_URLS=http://+:8282

# Expose port 8181
EXPOSE 8282

# Set the entry point for the application
ENTRYPOINT ["dotnet", "Northwind.dll"]
