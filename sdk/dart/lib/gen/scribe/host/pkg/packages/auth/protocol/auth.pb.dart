// This is a generated file - do not edit.
//
// Generated from scribe/host/pkg/packages/auth/protocol/auth.proto.

// @dart = 3.3

// ignore_for_file: annotate_overrides, camel_case_types, comment_references
// ignore_for_file: constant_identifier_names
// ignore_for_file: curly_braces_in_flow_control_structures
// ignore_for_file: deprecated_member_use_from_same_package, library_prefixes
// ignore_for_file: non_constant_identifier_names, prefer_relative_imports

import 'dart:async' as $async;
import 'dart:core' as $core;

import 'package:fixnum/fixnum.dart' as $fixnum;
import 'package:protobuf/protobuf.dart' as $pb;

import '../../../../../protocol/common.pb.dart' as $0;

export 'package:protobuf/protobuf.dart' show GeneratedMessageGenericExtensions;

class AccountRequest extends $pb.GeneratedMessage {
  factory AccountRequest({
    $core.String? accountId,
    $core.String? role,
  }) {
    final result = create();
    if (accountId != null) result.accountId = accountId;
    if (role != null) result.role = role;
    return result;
  }

  AccountRequest._();

  factory AccountRequest.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory AccountRequest.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'AccountRequest',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.auth.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'accountId')
    ..aOS(2, _omitFieldNames ? '' : 'role')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  AccountRequest clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  AccountRequest copyWith(void Function(AccountRequest) updates) =>
      super.copyWith((message) => updates(message as AccountRequest))
          as AccountRequest;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static AccountRequest create() => AccountRequest._();
  @$core.override
  AccountRequest createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static AccountRequest getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<AccountRequest>(create);
  static AccountRequest? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get accountId => $_getSZ(0);
  @$pb.TagNumber(1)
  set accountId($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasAccountId() => $_has(0);
  @$pb.TagNumber(1)
  void clearAccountId() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.String get role => $_getSZ(1);
  @$pb.TagNumber(2)
  set role($core.String value) => $_setString(1, value);
  @$pb.TagNumber(2)
  $core.bool hasRole() => $_has(1);
  @$pb.TagNumber(2)
  void clearRole() => $_clearField(2);
}

class Account extends $pb.GeneratedMessage {
  factory Account({
    $core.String? id,
    $core.String? role,
    $core.String? email,
    $core.String? phone,
    $core.bool? emailVerified,
    $core.bool? phoneVerified,
    $fixnum.Int64? createdAt,
    Ban? ban,
    $0.Json? folded,
  }) {
    final result = create();
    if (id != null) result.id = id;
    if (role != null) result.role = role;
    if (email != null) result.email = email;
    if (phone != null) result.phone = phone;
    if (emailVerified != null) result.emailVerified = emailVerified;
    if (phoneVerified != null) result.phoneVerified = phoneVerified;
    if (createdAt != null) result.createdAt = createdAt;
    if (ban != null) result.ban = ban;
    if (folded != null) result.folded = folded;
    return result;
  }

  Account._();

  factory Account.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory Account.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'Account',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.auth.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'id')
    ..aOS(2, _omitFieldNames ? '' : 'role')
    ..aOS(3, _omitFieldNames ? '' : 'email')
    ..aOS(4, _omitFieldNames ? '' : 'phone')
    ..aOB(5, _omitFieldNames ? '' : 'emailVerified')
    ..aOB(6, _omitFieldNames ? '' : 'phoneVerified')
    ..aInt64(7, _omitFieldNames ? '' : 'createdAt')
    ..aOM<Ban>(8, _omitFieldNames ? '' : 'ban', subBuilder: Ban.create)
    ..aOM<$0.Json>(9, _omitFieldNames ? '' : 'folded',
        subBuilder: $0.Json.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Account clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Account copyWith(void Function(Account) updates) =>
      super.copyWith((message) => updates(message as Account)) as Account;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static Account create() => Account._();
  @$core.override
  Account createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static Account getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<Account>(create);
  static Account? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get id => $_getSZ(0);
  @$pb.TagNumber(1)
  set id($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasId() => $_has(0);
  @$pb.TagNumber(1)
  void clearId() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.String get role => $_getSZ(1);
  @$pb.TagNumber(2)
  set role($core.String value) => $_setString(1, value);
  @$pb.TagNumber(2)
  $core.bool hasRole() => $_has(1);
  @$pb.TagNumber(2)
  void clearRole() => $_clearField(2);

  @$pb.TagNumber(3)
  $core.String get email => $_getSZ(2);
  @$pb.TagNumber(3)
  set email($core.String value) => $_setString(2, value);
  @$pb.TagNumber(3)
  $core.bool hasEmail() => $_has(2);
  @$pb.TagNumber(3)
  void clearEmail() => $_clearField(3);

  @$pb.TagNumber(4)
  $core.String get phone => $_getSZ(3);
  @$pb.TagNumber(4)
  set phone($core.String value) => $_setString(3, value);
  @$pb.TagNumber(4)
  $core.bool hasPhone() => $_has(3);
  @$pb.TagNumber(4)
  void clearPhone() => $_clearField(4);

  @$pb.TagNumber(5)
  $core.bool get emailVerified => $_getBF(4);
  @$pb.TagNumber(5)
  set emailVerified($core.bool value) => $_setBool(4, value);
  @$pb.TagNumber(5)
  $core.bool hasEmailVerified() => $_has(4);
  @$pb.TagNumber(5)
  void clearEmailVerified() => $_clearField(5);

  @$pb.TagNumber(6)
  $core.bool get phoneVerified => $_getBF(5);
  @$pb.TagNumber(6)
  set phoneVerified($core.bool value) => $_setBool(5, value);
  @$pb.TagNumber(6)
  $core.bool hasPhoneVerified() => $_has(5);
  @$pb.TagNumber(6)
  void clearPhoneVerified() => $_clearField(6);

  @$pb.TagNumber(7)
  $fixnum.Int64 get createdAt => $_getI64(6);
  @$pb.TagNumber(7)
  set createdAt($fixnum.Int64 value) => $_setInt64(6, value);
  @$pb.TagNumber(7)
  $core.bool hasCreatedAt() => $_has(6);
  @$pb.TagNumber(7)
  void clearCreatedAt() => $_clearField(7);

  @$pb.TagNumber(8)
  Ban get ban => $_getN(7);
  @$pb.TagNumber(8)
  set ban(Ban value) => $_setField(8, value);
  @$pb.TagNumber(8)
  $core.bool hasBan() => $_has(7);
  @$pb.TagNumber(8)
  void clearBan() => $_clearField(8);
  @$pb.TagNumber(8)
  Ban ensureBan() => $_ensure(7);

  @$pb.TagNumber(9)
  $0.Json get folded => $_getN(8);
  @$pb.TagNumber(9)
  set folded($0.Json value) => $_setField(9, value);
  @$pb.TagNumber(9)
  $core.bool hasFolded() => $_has(8);
  @$pb.TagNumber(9)
  void clearFolded() => $_clearField(9);
  @$pb.TagNumber(9)
  $0.Json ensureFolded() => $_ensure(8);
}

class AccountResult extends $pb.GeneratedMessage {
  factory AccountResult({
    Account? account,
    $0.Failure? error,
  }) {
    final result = create();
    if (account != null) result.account = account;
    if (error != null) result.error = error;
    return result;
  }

  AccountResult._();

  factory AccountResult.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory AccountResult.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'AccountResult',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.auth.v1'),
      createEmptyInstance: create)
    ..aOM<Account>(1, _omitFieldNames ? '' : 'account',
        subBuilder: Account.create)
    ..aOM<$0.Failure>(2, _omitFieldNames ? '' : 'error',
        subBuilder: $0.Failure.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  AccountResult clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  AccountResult copyWith(void Function(AccountResult) updates) =>
      super.copyWith((message) => updates(message as AccountResult))
          as AccountResult;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static AccountResult create() => AccountResult._();
  @$core.override
  AccountResult createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static AccountResult getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<AccountResult>(create);
  static AccountResult? _defaultInstance;

  @$pb.TagNumber(1)
  Account get account => $_getN(0);
  @$pb.TagNumber(1)
  set account(Account value) => $_setField(1, value);
  @$pb.TagNumber(1)
  $core.bool hasAccount() => $_has(0);
  @$pb.TagNumber(1)
  void clearAccount() => $_clearField(1);
  @$pb.TagNumber(1)
  Account ensureAccount() => $_ensure(0);

  @$pb.TagNumber(2)
  $0.Failure get error => $_getN(1);
  @$pb.TagNumber(2)
  set error($0.Failure value) => $_setField(2, value);
  @$pb.TagNumber(2)
  $core.bool hasError() => $_has(1);
  @$pb.TagNumber(2)
  void clearError() => $_clearField(2);
  @$pb.TagNumber(2)
  $0.Failure ensureError() => $_ensure(1);
}

class Ban extends $pb.GeneratedMessage {
  factory Ban({
    $fixnum.Int64? since,
    $fixnum.Int64? until,
    $core.String? reason,
  }) {
    final result = create();
    if (since != null) result.since = since;
    if (until != null) result.until = until;
    if (reason != null) result.reason = reason;
    return result;
  }

  Ban._();

  factory Ban.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory Ban.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'Ban',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.auth.v1'),
      createEmptyInstance: create)
    ..aInt64(1, _omitFieldNames ? '' : 'since')
    ..aInt64(2, _omitFieldNames ? '' : 'until')
    ..aOS(3, _omitFieldNames ? '' : 'reason')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Ban clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Ban copyWith(void Function(Ban) updates) =>
      super.copyWith((message) => updates(message as Ban)) as Ban;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static Ban create() => Ban._();
  @$core.override
  Ban createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static Ban getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<Ban>(create);
  static Ban? _defaultInstance;

  @$pb.TagNumber(1)
  $fixnum.Int64 get since => $_getI64(0);
  @$pb.TagNumber(1)
  set since($fixnum.Int64 value) => $_setInt64(0, value);
  @$pb.TagNumber(1)
  $core.bool hasSince() => $_has(0);
  @$pb.TagNumber(1)
  void clearSince() => $_clearField(1);

  @$pb.TagNumber(2)
  $fixnum.Int64 get until => $_getI64(1);
  @$pb.TagNumber(2)
  set until($fixnum.Int64 value) => $_setInt64(1, value);
  @$pb.TagNumber(2)
  $core.bool hasUntil() => $_has(1);
  @$pb.TagNumber(2)
  void clearUntil() => $_clearField(2);

  @$pb.TagNumber(3)
  $core.String get reason => $_getSZ(2);
  @$pb.TagNumber(3)
  set reason($core.String value) => $_setString(2, value);
  @$pb.TagNumber(3)
  $core.bool hasReason() => $_has(2);
  @$pb.TagNumber(3)
  void clearReason() => $_clearField(3);
}

class BanRequest extends $pb.GeneratedMessage {
  factory BanRequest({
    $core.String? accountId,
    $core.String? role,
    $fixnum.Int64? forMs,
    $core.String? reason,
  }) {
    final result = create();
    if (accountId != null) result.accountId = accountId;
    if (role != null) result.role = role;
    if (forMs != null) result.forMs = forMs;
    if (reason != null) result.reason = reason;
    return result;
  }

  BanRequest._();

  factory BanRequest.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory BanRequest.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'BanRequest',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.auth.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'accountId')
    ..aOS(2, _omitFieldNames ? '' : 'role')
    ..aInt64(3, _omitFieldNames ? '' : 'forMs')
    ..aOS(4, _omitFieldNames ? '' : 'reason')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  BanRequest clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  BanRequest copyWith(void Function(BanRequest) updates) =>
      super.copyWith((message) => updates(message as BanRequest)) as BanRequest;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static BanRequest create() => BanRequest._();
  @$core.override
  BanRequest createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static BanRequest getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<BanRequest>(create);
  static BanRequest? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get accountId => $_getSZ(0);
  @$pb.TagNumber(1)
  set accountId($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasAccountId() => $_has(0);
  @$pb.TagNumber(1)
  void clearAccountId() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.String get role => $_getSZ(1);
  @$pb.TagNumber(2)
  set role($core.String value) => $_setString(1, value);
  @$pb.TagNumber(2)
  $core.bool hasRole() => $_has(1);
  @$pb.TagNumber(2)
  void clearRole() => $_clearField(2);

  @$pb.TagNumber(3)
  $fixnum.Int64 get forMs => $_getI64(2);
  @$pb.TagNumber(3)
  set forMs($fixnum.Int64 value) => $_setInt64(2, value);
  @$pb.TagNumber(3)
  $core.bool hasForMs() => $_has(2);
  @$pb.TagNumber(3)
  void clearForMs() => $_clearField(3);

  @$pb.TagNumber(4)
  $core.String get reason => $_getSZ(3);
  @$pb.TagNumber(4)
  set reason($core.String value) => $_setString(3, value);
  @$pb.TagNumber(4)
  $core.bool hasReason() => $_has(3);
  @$pb.TagNumber(4)
  void clearReason() => $_clearField(4);
}

class BanResult extends $pb.GeneratedMessage {
  factory BanResult({
    $0.Failure? error,
  }) {
    final result = create();
    if (error != null) result.error = error;
    return result;
  }

  BanResult._();

  factory BanResult.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory BanResult.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'BanResult',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.auth.v1'),
      createEmptyInstance: create)
    ..aOM<$0.Failure>(1, _omitFieldNames ? '' : 'error',
        subBuilder: $0.Failure.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  BanResult clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  BanResult copyWith(void Function(BanResult) updates) =>
      super.copyWith((message) => updates(message as BanResult)) as BanResult;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static BanResult create() => BanResult._();
  @$core.override
  BanResult createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static BanResult getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<BanResult>(create);
  static BanResult? _defaultInstance;

  @$pb.TagNumber(1)
  $0.Failure get error => $_getN(0);
  @$pb.TagNumber(1)
  set error($0.Failure value) => $_setField(1, value);
  @$pb.TagNumber(1)
  $core.bool hasError() => $_has(0);
  @$pb.TagNumber(1)
  void clearError() => $_clearField(1);
  @$pb.TagNumber(1)
  $0.Failure ensureError() => $_ensure(0);
}

class BanListRequest extends $pb.GeneratedMessage {
  factory BanListRequest({
    $core.String? role,
  }) {
    final result = create();
    if (role != null) result.role = role;
    return result;
  }

  BanListRequest._();

  factory BanListRequest.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory BanListRequest.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'BanListRequest',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.auth.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'role')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  BanListRequest clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  BanListRequest copyWith(void Function(BanListRequest) updates) =>
      super.copyWith((message) => updates(message as BanListRequest))
          as BanListRequest;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static BanListRequest create() => BanListRequest._();
  @$core.override
  BanListRequest createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static BanListRequest getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<BanListRequest>(create);
  static BanListRequest? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get role => $_getSZ(0);
  @$pb.TagNumber(1)
  set role($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasRole() => $_has(0);
  @$pb.TagNumber(1)
  void clearRole() => $_clearField(1);
}

class ListedBan extends $pb.GeneratedMessage {
  factory ListedBan({
    $core.String? accountId,
    Ban? ban,
  }) {
    final result = create();
    if (accountId != null) result.accountId = accountId;
    if (ban != null) result.ban = ban;
    return result;
  }

  ListedBan._();

  factory ListedBan.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory ListedBan.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'ListedBan',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.auth.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'accountId')
    ..aOM<Ban>(2, _omitFieldNames ? '' : 'ban', subBuilder: Ban.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  ListedBan clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  ListedBan copyWith(void Function(ListedBan) updates) =>
      super.copyWith((message) => updates(message as ListedBan)) as ListedBan;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static ListedBan create() => ListedBan._();
  @$core.override
  ListedBan createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static ListedBan getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<ListedBan>(create);
  static ListedBan? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get accountId => $_getSZ(0);
  @$pb.TagNumber(1)
  set accountId($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasAccountId() => $_has(0);
  @$pb.TagNumber(1)
  void clearAccountId() => $_clearField(1);

  @$pb.TagNumber(2)
  Ban get ban => $_getN(1);
  @$pb.TagNumber(2)
  set ban(Ban value) => $_setField(2, value);
  @$pb.TagNumber(2)
  $core.bool hasBan() => $_has(1);
  @$pb.TagNumber(2)
  void clearBan() => $_clearField(2);
  @$pb.TagNumber(2)
  Ban ensureBan() => $_ensure(1);
}

class BanListResult extends $pb.GeneratedMessage {
  factory BanListResult({
    $core.Iterable<ListedBan>? bans,
    $0.Failure? error,
  }) {
    final result = create();
    if (bans != null) result.bans.addAll(bans);
    if (error != null) result.error = error;
    return result;
  }

  BanListResult._();

  factory BanListResult.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory BanListResult.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'BanListResult',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.auth.v1'),
      createEmptyInstance: create)
    ..pPM<ListedBan>(1, _omitFieldNames ? '' : 'bans',
        subBuilder: ListedBan.create)
    ..aOM<$0.Failure>(2, _omitFieldNames ? '' : 'error',
        subBuilder: $0.Failure.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  BanListResult clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  BanListResult copyWith(void Function(BanListResult) updates) =>
      super.copyWith((message) => updates(message as BanListResult))
          as BanListResult;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static BanListResult create() => BanListResult._();
  @$core.override
  BanListResult createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static BanListResult getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<BanListResult>(create);
  static BanListResult? _defaultInstance;

  @$pb.TagNumber(1)
  $pb.PbList<ListedBan> get bans => $_getList(0);

  @$pb.TagNumber(2)
  $0.Failure get error => $_getN(1);
  @$pb.TagNumber(2)
  set error($0.Failure value) => $_setField(2, value);
  @$pb.TagNumber(2)
  $core.bool hasError() => $_has(1);
  @$pb.TagNumber(2)
  void clearError() => $_clearField(2);
  @$pb.TagNumber(2)
  $0.Failure ensureError() => $_ensure(1);
}

class DeviceRequest extends $pb.GeneratedMessage {
  factory DeviceRequest({
    $core.String? accountId,
    $core.String? role,
    $core.String? deviceId,
  }) {
    final result = create();
    if (accountId != null) result.accountId = accountId;
    if (role != null) result.role = role;
    if (deviceId != null) result.deviceId = deviceId;
    return result;
  }

  DeviceRequest._();

  factory DeviceRequest.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory DeviceRequest.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'DeviceRequest',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.auth.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'accountId')
    ..aOS(2, _omitFieldNames ? '' : 'role')
    ..aOS(3, _omitFieldNames ? '' : 'deviceId')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  DeviceRequest clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  DeviceRequest copyWith(void Function(DeviceRequest) updates) =>
      super.copyWith((message) => updates(message as DeviceRequest))
          as DeviceRequest;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static DeviceRequest create() => DeviceRequest._();
  @$core.override
  DeviceRequest createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static DeviceRequest getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<DeviceRequest>(create);
  static DeviceRequest? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get accountId => $_getSZ(0);
  @$pb.TagNumber(1)
  set accountId($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasAccountId() => $_has(0);
  @$pb.TagNumber(1)
  void clearAccountId() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.String get role => $_getSZ(1);
  @$pb.TagNumber(2)
  set role($core.String value) => $_setString(1, value);
  @$pb.TagNumber(2)
  $core.bool hasRole() => $_has(1);
  @$pb.TagNumber(2)
  void clearRole() => $_clearField(2);

  @$pb.TagNumber(3)
  $core.String get deviceId => $_getSZ(2);
  @$pb.TagNumber(3)
  set deviceId($core.String value) => $_setString(2, value);
  @$pb.TagNumber(3)
  $core.bool hasDeviceId() => $_has(2);
  @$pb.TagNumber(3)
  void clearDeviceId() => $_clearField(3);
}

class Device extends $pb.GeneratedMessage {
  factory Device({
    $core.String? id,
    $core.String? deviceId,
    $core.String? client,
    $core.String? os,
    $core.String? model,
    $core.String? appVersion,
    $core.bool? isPhysicalDevice,
    $core.String? deviceCategory,
    $core.bool? trusted,
    $core.String? ip,
    $core.String? city,
    $core.String? country,
    $fixnum.Int64? createdAt,
    $fixnum.Int64? seenAt,
  }) {
    final result = create();
    if (id != null) result.id = id;
    if (deviceId != null) result.deviceId = deviceId;
    if (client != null) result.client = client;
    if (os != null) result.os = os;
    if (model != null) result.model = model;
    if (appVersion != null) result.appVersion = appVersion;
    if (isPhysicalDevice != null) result.isPhysicalDevice = isPhysicalDevice;
    if (deviceCategory != null) result.deviceCategory = deviceCategory;
    if (trusted != null) result.trusted = trusted;
    if (ip != null) result.ip = ip;
    if (city != null) result.city = city;
    if (country != null) result.country = country;
    if (createdAt != null) result.createdAt = createdAt;
    if (seenAt != null) result.seenAt = seenAt;
    return result;
  }

  Device._();

  factory Device.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory Device.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'Device',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.auth.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'id')
    ..aOS(2, _omitFieldNames ? '' : 'deviceId')
    ..aOS(3, _omitFieldNames ? '' : 'client')
    ..aOS(4, _omitFieldNames ? '' : 'os')
    ..aOS(5, _omitFieldNames ? '' : 'model')
    ..aOS(6, _omitFieldNames ? '' : 'appVersion')
    ..aOB(7, _omitFieldNames ? '' : 'isPhysicalDevice')
    ..aOS(8, _omitFieldNames ? '' : 'deviceCategory')
    ..aOB(9, _omitFieldNames ? '' : 'trusted')
    ..aOS(10, _omitFieldNames ? '' : 'ip')
    ..aOS(11, _omitFieldNames ? '' : 'city')
    ..aOS(12, _omitFieldNames ? '' : 'country')
    ..aInt64(13, _omitFieldNames ? '' : 'createdAt')
    ..aInt64(14, _omitFieldNames ? '' : 'seenAt')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Device clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Device copyWith(void Function(Device) updates) =>
      super.copyWith((message) => updates(message as Device)) as Device;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static Device create() => Device._();
  @$core.override
  Device createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static Device getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<Device>(create);
  static Device? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get id => $_getSZ(0);
  @$pb.TagNumber(1)
  set id($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasId() => $_has(0);
  @$pb.TagNumber(1)
  void clearId() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.String get deviceId => $_getSZ(1);
  @$pb.TagNumber(2)
  set deviceId($core.String value) => $_setString(1, value);
  @$pb.TagNumber(2)
  $core.bool hasDeviceId() => $_has(1);
  @$pb.TagNumber(2)
  void clearDeviceId() => $_clearField(2);

  @$pb.TagNumber(3)
  $core.String get client => $_getSZ(2);
  @$pb.TagNumber(3)
  set client($core.String value) => $_setString(2, value);
  @$pb.TagNumber(3)
  $core.bool hasClient() => $_has(2);
  @$pb.TagNumber(3)
  void clearClient() => $_clearField(3);

  @$pb.TagNumber(4)
  $core.String get os => $_getSZ(3);
  @$pb.TagNumber(4)
  set os($core.String value) => $_setString(3, value);
  @$pb.TagNumber(4)
  $core.bool hasOs() => $_has(3);
  @$pb.TagNumber(4)
  void clearOs() => $_clearField(4);

  @$pb.TagNumber(5)
  $core.String get model => $_getSZ(4);
  @$pb.TagNumber(5)
  set model($core.String value) => $_setString(4, value);
  @$pb.TagNumber(5)
  $core.bool hasModel() => $_has(4);
  @$pb.TagNumber(5)
  void clearModel() => $_clearField(5);

  @$pb.TagNumber(6)
  $core.String get appVersion => $_getSZ(5);
  @$pb.TagNumber(6)
  set appVersion($core.String value) => $_setString(5, value);
  @$pb.TagNumber(6)
  $core.bool hasAppVersion() => $_has(5);
  @$pb.TagNumber(6)
  void clearAppVersion() => $_clearField(6);

  @$pb.TagNumber(7)
  $core.bool get isPhysicalDevice => $_getBF(6);
  @$pb.TagNumber(7)
  set isPhysicalDevice($core.bool value) => $_setBool(6, value);
  @$pb.TagNumber(7)
  $core.bool hasIsPhysicalDevice() => $_has(6);
  @$pb.TagNumber(7)
  void clearIsPhysicalDevice() => $_clearField(7);

  @$pb.TagNumber(8)
  $core.String get deviceCategory => $_getSZ(7);
  @$pb.TagNumber(8)
  set deviceCategory($core.String value) => $_setString(7, value);
  @$pb.TagNumber(8)
  $core.bool hasDeviceCategory() => $_has(7);
  @$pb.TagNumber(8)
  void clearDeviceCategory() => $_clearField(8);

  @$pb.TagNumber(9)
  $core.bool get trusted => $_getBF(8);
  @$pb.TagNumber(9)
  set trusted($core.bool value) => $_setBool(8, value);
  @$pb.TagNumber(9)
  $core.bool hasTrusted() => $_has(8);
  @$pb.TagNumber(9)
  void clearTrusted() => $_clearField(9);

  @$pb.TagNumber(10)
  $core.String get ip => $_getSZ(9);
  @$pb.TagNumber(10)
  set ip($core.String value) => $_setString(9, value);
  @$pb.TagNumber(10)
  $core.bool hasIp() => $_has(9);
  @$pb.TagNumber(10)
  void clearIp() => $_clearField(10);

  @$pb.TagNumber(11)
  $core.String get city => $_getSZ(10);
  @$pb.TagNumber(11)
  set city($core.String value) => $_setString(10, value);
  @$pb.TagNumber(11)
  $core.bool hasCity() => $_has(10);
  @$pb.TagNumber(11)
  void clearCity() => $_clearField(11);

  @$pb.TagNumber(12)
  $core.String get country => $_getSZ(11);
  @$pb.TagNumber(12)
  set country($core.String value) => $_setString(11, value);
  @$pb.TagNumber(12)
  $core.bool hasCountry() => $_has(11);
  @$pb.TagNumber(12)
  void clearCountry() => $_clearField(12);

  @$pb.TagNumber(13)
  $fixnum.Int64 get createdAt => $_getI64(12);
  @$pb.TagNumber(13)
  set createdAt($fixnum.Int64 value) => $_setInt64(12, value);
  @$pb.TagNumber(13)
  $core.bool hasCreatedAt() => $_has(12);
  @$pb.TagNumber(13)
  void clearCreatedAt() => $_clearField(13);

  @$pb.TagNumber(14)
  $fixnum.Int64 get seenAt => $_getI64(13);
  @$pb.TagNumber(14)
  set seenAt($fixnum.Int64 value) => $_setInt64(13, value);
  @$pb.TagNumber(14)
  $core.bool hasSeenAt() => $_has(13);
  @$pb.TagNumber(14)
  void clearSeenAt() => $_clearField(14);
}

class DeviceListResult extends $pb.GeneratedMessage {
  factory DeviceListResult({
    $core.Iterable<Device>? devices,
    $0.Failure? error,
  }) {
    final result = create();
    if (devices != null) result.devices.addAll(devices);
    if (error != null) result.error = error;
    return result;
  }

  DeviceListResult._();

  factory DeviceListResult.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory DeviceListResult.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'DeviceListResult',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.auth.v1'),
      createEmptyInstance: create)
    ..pPM<Device>(1, _omitFieldNames ? '' : 'devices',
        subBuilder: Device.create)
    ..aOM<$0.Failure>(2, _omitFieldNames ? '' : 'error',
        subBuilder: $0.Failure.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  DeviceListResult clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  DeviceListResult copyWith(void Function(DeviceListResult) updates) =>
      super.copyWith((message) => updates(message as DeviceListResult))
          as DeviceListResult;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static DeviceListResult create() => DeviceListResult._();
  @$core.override
  DeviceListResult createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static DeviceListResult getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<DeviceListResult>(create);
  static DeviceListResult? _defaultInstance;

  @$pb.TagNumber(1)
  $pb.PbList<Device> get devices => $_getList(0);

  @$pb.TagNumber(2)
  $0.Failure get error => $_getN(1);
  @$pb.TagNumber(2)
  set error($0.Failure value) => $_setField(2, value);
  @$pb.TagNumber(2)
  $core.bool hasError() => $_has(1);
  @$pb.TagNumber(2)
  void clearError() => $_clearField(2);
  @$pb.TagNumber(2)
  $0.Failure ensureError() => $_ensure(1);
}

class KickResult extends $pb.GeneratedMessage {
  factory KickResult({
    $core.bool? kicked,
    $0.Failure? error,
  }) {
    final result = create();
    if (kicked != null) result.kicked = kicked;
    if (error != null) result.error = error;
    return result;
  }

  KickResult._();

  factory KickResult.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory KickResult.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'KickResult',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.auth.v1'),
      createEmptyInstance: create)
    ..aOB(1, _omitFieldNames ? '' : 'kicked')
    ..aOM<$0.Failure>(2, _omitFieldNames ? '' : 'error',
        subBuilder: $0.Failure.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  KickResult clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  KickResult copyWith(void Function(KickResult) updates) =>
      super.copyWith((message) => updates(message as KickResult)) as KickResult;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static KickResult create() => KickResult._();
  @$core.override
  KickResult createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static KickResult getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<KickResult>(create);
  static KickResult? _defaultInstance;

  @$pb.TagNumber(1)
  $core.bool get kicked => $_getBF(0);
  @$pb.TagNumber(1)
  set kicked($core.bool value) => $_setBool(0, value);
  @$pb.TagNumber(1)
  $core.bool hasKicked() => $_has(0);
  @$pb.TagNumber(1)
  void clearKicked() => $_clearField(1);

  @$pb.TagNumber(2)
  $0.Failure get error => $_getN(1);
  @$pb.TagNumber(2)
  set error($0.Failure value) => $_setField(2, value);
  @$pb.TagNumber(2)
  $core.bool hasError() => $_has(1);
  @$pb.TagNumber(2)
  void clearError() => $_clearField(2);
  @$pb.TagNumber(2)
  $0.Failure ensureError() => $_ensure(1);
}

class ValidateRequest extends $pb.GeneratedMessage {
  factory ValidateRequest({
    $core.String? password,
    $core.String? email,
    $core.String? phone,
  }) {
    final result = create();
    if (password != null) result.password = password;
    if (email != null) result.email = email;
    if (phone != null) result.phone = phone;
    return result;
  }

  ValidateRequest._();

  factory ValidateRequest.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory ValidateRequest.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'ValidateRequest',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.auth.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'password')
    ..aOS(2, _omitFieldNames ? '' : 'email')
    ..aOS(3, _omitFieldNames ? '' : 'phone')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  ValidateRequest clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  ValidateRequest copyWith(void Function(ValidateRequest) updates) =>
      super.copyWith((message) => updates(message as ValidateRequest))
          as ValidateRequest;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static ValidateRequest create() => ValidateRequest._();
  @$core.override
  ValidateRequest createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static ValidateRequest getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<ValidateRequest>(create);
  static ValidateRequest? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get password => $_getSZ(0);
  @$pb.TagNumber(1)
  set password($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasPassword() => $_has(0);
  @$pb.TagNumber(1)
  void clearPassword() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.String get email => $_getSZ(1);
  @$pb.TagNumber(2)
  set email($core.String value) => $_setString(1, value);
  @$pb.TagNumber(2)
  $core.bool hasEmail() => $_has(1);
  @$pb.TagNumber(2)
  void clearEmail() => $_clearField(2);

  @$pb.TagNumber(3)
  $core.String get phone => $_getSZ(2);
  @$pb.TagNumber(3)
  set phone($core.String value) => $_setString(2, value);
  @$pb.TagNumber(3)
  $core.bool hasPhone() => $_has(2);
  @$pb.TagNumber(3)
  void clearPhone() => $_clearField(3);
}

class ValidateResult extends $pb.GeneratedMessage {
  factory ValidateResult({
    $core.bool? valid,
    $core.Iterable<$core.String>? violations,
  }) {
    final result = create();
    if (valid != null) result.valid = valid;
    if (violations != null) result.violations.addAll(violations);
    return result;
  }

  ValidateResult._();

  factory ValidateResult.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory ValidateResult.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'ValidateResult',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.auth.v1'),
      createEmptyInstance: create)
    ..aOB(1, _omitFieldNames ? '' : 'valid')
    ..pPS(2, _omitFieldNames ? '' : 'violations')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  ValidateResult clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  ValidateResult copyWith(void Function(ValidateResult) updates) =>
      super.copyWith((message) => updates(message as ValidateResult))
          as ValidateResult;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static ValidateResult create() => ValidateResult._();
  @$core.override
  ValidateResult createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static ValidateResult getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<ValidateResult>(create);
  static ValidateResult? _defaultInstance;

  @$pb.TagNumber(1)
  $core.bool get valid => $_getBF(0);
  @$pb.TagNumber(1)
  set valid($core.bool value) => $_setBool(0, value);
  @$pb.TagNumber(1)
  $core.bool hasValid() => $_has(0);
  @$pb.TagNumber(1)
  void clearValid() => $_clearField(1);

  @$pb.TagNumber(2)
  $pb.PbList<$core.String> get violations => $_getList(1);
}

class RoleListRequest extends $pb.GeneratedMessage {
  factory RoleListRequest() => create();

  RoleListRequest._();

  factory RoleListRequest.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory RoleListRequest.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'RoleListRequest',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.auth.v1'),
      createEmptyInstance: create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  RoleListRequest clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  RoleListRequest copyWith(void Function(RoleListRequest) updates) =>
      super.copyWith((message) => updates(message as RoleListRequest))
          as RoleListRequest;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static RoleListRequest create() => RoleListRequest._();
  @$core.override
  RoleListRequest createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static RoleListRequest getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<RoleListRequest>(create);
  static RoleListRequest? _defaultInstance;
}

class RoleListResult extends $pb.GeneratedMessage {
  factory RoleListResult({
    $core.Iterable<Role>? roles,
  }) {
    final result = create();
    if (roles != null) result.roles.addAll(roles);
    return result;
  }

  RoleListResult._();

  factory RoleListResult.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory RoleListResult.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'RoleListResult',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.auth.v1'),
      createEmptyInstance: create)
    ..pPM<Role>(1, _omitFieldNames ? '' : 'roles', subBuilder: Role.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  RoleListResult clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  RoleListResult copyWith(void Function(RoleListResult) updates) =>
      super.copyWith((message) => updates(message as RoleListResult))
          as RoleListResult;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static RoleListResult create() => RoleListResult._();
  @$core.override
  RoleListResult createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static RoleListResult getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<RoleListResult>(create);
  static RoleListResult? _defaultInstance;

  @$pb.TagNumber(1)
  $pb.PbList<Role> get roles => $_getList(0);
}

class Role extends $pb.GeneratedMessage {
  factory Role({
    $core.String? name,
    $core.Iterable<$core.String>? channels,
    $core.String? created,
  }) {
    final result = create();
    if (name != null) result.name = name;
    if (channels != null) result.channels.addAll(channels);
    if (created != null) result.created = created;
    return result;
  }

  Role._();

  factory Role.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory Role.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'Role',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.auth.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'name')
    ..pPS(2, _omitFieldNames ? '' : 'channels')
    ..aOS(3, _omitFieldNames ? '' : 'created')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Role clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Role copyWith(void Function(Role) updates) =>
      super.copyWith((message) => updates(message as Role)) as Role;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static Role create() => Role._();
  @$core.override
  Role createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static Role getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<Role>(create);
  static Role? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get name => $_getSZ(0);
  @$pb.TagNumber(1)
  set name($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasName() => $_has(0);
  @$pb.TagNumber(1)
  void clearName() => $_clearField(1);

  @$pb.TagNumber(2)
  $pb.PbList<$core.String> get channels => $_getList(1);

  @$pb.TagNumber(3)
  $core.String get created => $_getSZ(2);
  @$pb.TagNumber(3)
  set created($core.String value) => $_setString(2, value);
  @$pb.TagNumber(3)
  $core.bool hasCreated() => $_has(2);
  @$pb.TagNumber(3)
  void clearCreated() => $_clearField(3);
}

class AuthApi {
  final $pb.RpcClient _client;

  AuthApi(this._client);

  $async.Future<AccountResult> getAccount(
          $pb.ClientContext? ctx, AccountRequest request) =>
      _client.invoke<AccountResult>(
          ctx, 'Auth', 'GetAccount', request, AccountResult());
  $async.Future<BanResult> deleteAccount(
          $pb.ClientContext? ctx, AccountRequest request) =>
      _client.invoke<BanResult>(
          ctx, 'Auth', 'DeleteAccount', request, BanResult());
  $async.Future<BanResult> ban($pb.ClientContext? ctx, BanRequest request) =>
      _client.invoke<BanResult>(ctx, 'Auth', 'Ban', request, BanResult());
  $async.Future<BanResult> unban(
          $pb.ClientContext? ctx, AccountRequest request) =>
      _client.invoke<BanResult>(ctx, 'Auth', 'Unban', request, BanResult());
  $async.Future<BanListResult> listBans(
          $pb.ClientContext? ctx, BanListRequest request) =>
      _client.invoke<BanListResult>(
          ctx, 'Auth', 'ListBans', request, BanListResult());
  $async.Future<DeviceListResult> listDevices(
          $pb.ClientContext? ctx, DeviceRequest request) =>
      _client.invoke<DeviceListResult>(
          ctx, 'Auth', 'ListDevices', request, DeviceListResult());
  $async.Future<KickResult> kickDevice(
          $pb.ClientContext? ctx, DeviceRequest request) =>
      _client.invoke<KickResult>(
          ctx, 'Auth', 'KickDevice', request, KickResult());
  $async.Future<KickResult> kickAllDevices(
          $pb.ClientContext? ctx, DeviceRequest request) =>
      _client.invoke<KickResult>(
          ctx, 'Auth', 'KickAllDevices', request, KickResult());
  $async.Future<RoleListResult> listRoles(
          $pb.ClientContext? ctx, RoleListRequest request) =>
      _client.invoke<RoleListResult>(
          ctx, 'Auth', 'ListRoles', request, RoleListResult());
  $async.Future<ValidateResult> validate(
          $pb.ClientContext? ctx, ValidateRequest request) =>
      _client.invoke<ValidateResult>(
          ctx, 'Auth', 'Validate', request, ValidateResult());
}

const $core.bool _omitFieldNames =
    $core.bool.fromEnvironment('protobuf.omit_field_names');
const $core.bool _omitMessageNames =
    $core.bool.fromEnvironment('protobuf.omit_message_names');
