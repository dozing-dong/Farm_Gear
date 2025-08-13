using FarmGear_Application.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace FarmGear_Application.Data;

/// <summary>
/// Application database context
/// </summary>
public class ApplicationDbContext : IdentityDbContext<AppUser>
{
  public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
      : base(options)
  {
  }

  public DbSet<Equipment> Equipment { get; set; } = null!;
  public DbSet<Order> Orders { get; set; } = null!;
  public DbSet<PaymentRecord> PaymentRecords { get; set; } = null!;
  public DbSet<Review> Reviews { get; set; } = null!;

  protected override void OnModelCreating(ModelBuilder builder)
  {
    base.OnModelCreating(builder);

    // Configure user table indexes
    builder.Entity<AppUser>(entity =>
    {
      entity.HasIndex(u => u.Email).IsUnique();
      entity.HasIndex(u => u.UserName).IsUnique();
      entity.HasIndex(u => u.CreatedAt);
      entity.HasIndex(u => u.LastLoginAt);

      // Configure spatial index
      entity.HasIndex(u => new { u.Lng, u.Lat });

      // Configure properties
      entity.Property(u => u.FullName).IsRequired().HasMaxLength(100);
      entity.Property(u => u.IsActive).HasDefaultValue(true);
      entity.Property(u => u.CreatedAt).IsRequired();
      entity.Property(u => u.Lat).HasColumnType("decimal(10,6)");
      entity.Property(u => u.Lng).HasColumnType("decimal(10,6)");
    });

    // Configure Equipment entity
    builder.Entity<Equipment>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
      entity.Property(e => e.Description).HasMaxLength(500);
      entity.Property(e => e.DailyPrice).HasColumnType("decimal(18,2)");
      entity.Property(e => e.Latitude).HasColumnType("decimal(10,6)");
      entity.Property(e => e.Longitude).HasColumnType("decimal(10,6)");
      entity.Property(e => e.Status).IsRequired();
      entity.Property(e => e.OwnerId).IsRequired();
      entity.Property(e => e.CreatedAt).IsRequired();
      entity.Property(e => e.AverageRating)
          .HasColumnType("decimal(3,2)")
          .HasDefaultValue(0.0m)
          .IsRequired();

      // Configure relationship with AppUser
      entity.HasOne(e => e.Owner)
          .WithMany()
          .HasForeignKey(e => e.OwnerId)
          .OnDelete(DeleteBehavior.Restrict);

      // Configure spatial index
      entity.HasIndex(e => new { e.Longitude, e.Latitude });
    });

    // Configure Order entity
    builder.Entity<Order>(entity =>
    {
      entity.HasKey(e => e.Id);
      entity.Property(e => e.TotalAmount)
          .HasColumnType("decimal(18,2)")
          .HasDefaultValue(0m);
      entity.Property(e => e.Status).HasConversion<int>();
      entity.Property(e => e.StartDate).IsRequired();
      entity.Property(e => e.EndDate).IsRequired();
      entity.Property(e => e.CreatedAt).IsRequired();
      entity.Property(e => e.UpdatedAt)
          .IsRequired(false)
          .ValueGeneratedOnAddOrUpdate();

      // Configure relationship with Equipment
      entity.HasOne(e => e.Equipment)
          .WithMany()
          .HasForeignKey(e => e.EquipmentId)
          .OnDelete(DeleteBehavior.Restrict);

      // Configure relationship with Renter
      entity.HasOne(e => e.Renter)
          .WithMany()
          .HasForeignKey(e => e.RenterId)
          .OnDelete(DeleteBehavior.Restrict);

      // Add indexes
      entity.HasIndex(e => e.EquipmentId);
      entity.HasIndex(e => e.RenterId);
      entity.HasIndex(e => e.Status);
      entity.HasIndex(e => e.CreatedAt);
      entity.HasIndex(e => e.StartDate);
      entity.HasIndex(e => e.EndDate);
    });

    // Configure payment record
    builder.Entity<PaymentRecord>(entity =>
    {
      entity.HasKey(p => p.Id);
      entity.Property(p => p.Amount).HasColumnType("decimal(18,2)");
      entity.Property(p => p.Status).HasConversion<int>();
      entity.Property(p => p.CreatedAt).IsRequired();
      entity.Property(p => p.PaidAt).IsRequired(false);

      // Configure unique constraint: one order can only have one payment record
      entity.HasIndex(p => p.OrderId).IsUnique();

      // Configure foreign key relationship
      entity.HasOne(p => p.Order)
          .WithOne()
          .HasForeignKey<PaymentRecord>(p => p.OrderId)
          .OnDelete(DeleteBehavior.Restrict);

      entity.HasOne(p => p.User)
          .WithMany()
          .HasForeignKey(p => p.UserId)
          .OnDelete(DeleteBehavior.Restrict);

      // Add indexes
      entity.HasIndex(p => p.CreatedAt);
      entity.HasIndex(p => p.Status);
      entity.HasIndex(p => p.UserId);
    });

    // Configure review entity
    builder.Entity<Review>(entity =>
    {
      entity.HasKey(r => r.Id);
      entity.Property(r => r.Rating)
          .IsRequired()
          .HasAnnotation("Range", new[] { 1, 5 });
      entity.Property(r => r.Content).HasMaxLength(500);
      entity.Property(r => r.CreatedAt).IsRequired();
      entity.Property(r => r.UpdatedAt)
          .IsRequired()
          .ValueGeneratedOnAddOrUpdate();

      // Configure relationship with Equipment
      entity.HasOne(r => r.Equipment)
          .WithMany()
          .HasForeignKey(r => r.EquipmentId)
          .OnDelete(DeleteBehavior.Restrict);

      // Configure relationship with Order
      entity.HasOne(r => r.Order)
          .WithMany()
          .HasForeignKey(r => r.OrderId)
          .OnDelete(DeleteBehavior.Restrict);

      // Configure relationship with User
      entity.HasOne(r => r.User)
          .WithMany()
          .HasForeignKey(r => r.UserId)
          .OnDelete(DeleteBehavior.Restrict);

      // Add indexes
      entity.HasIndex(r => r.EquipmentId);
      entity.HasIndex(r => r.OrderId);
      entity.HasIndex(r => r.UserId);
      entity.HasIndex(r => r.CreatedAt);
      entity.HasIndex(r => r.Rating);

      // Add unique constraint: one user can only review the same equipment once
      entity.HasIndex(r => new { r.EquipmentId, r.UserId }).IsUnique();
    });
  }

  // Removed problematic SaveChangesAsync method
  // Spatial indexes should be managed through Entity Framework migrations, not created on every save
}