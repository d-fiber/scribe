// This is a generated file - do not edit.
//
// Generated from scribe/host/dependencies/security/auth/protocol/auth.proto.

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
    $core.String? userId,
    $core.String? email,
  }) {
    final result = create();
    if (userId != null) result.userId = userId;
    if (email != null) result.email = email;
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
    ..aOS(1, _omitFieldNames ? '' : 'userId')
    ..aOS(2, _omitFieldNames ? '' : 'email')
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
  $core.String get userId => $_getSZ(0);
  @$pb.TagNumber(1)
  set userId($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasUserId() => $_has(0);
  @$pb.TagNumber(1)
  void clearUserId() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.String get email => $_getSZ(1);
  @$pb.TagNumber(2)
  set email($core.String value) => $_setString(1, value);
  @$pb.TagNumber(2)
  $core.bool hasEmail() => $_has(1);
  @$pb.TagNumber(2)
  void clearEmail() => $_clearField(2);
}

class Account extends $pb.GeneratedMessage {
  factory Account({
    $core.String? id,
    $core.String? email,
    $core.String? phone,
    $core.bool? emailConfirmed,
    $core.bool? phoneConfirmed,
    $0.Json? appMetadata,
    $0.Json? userMetadata,
    $fixnum.Int64? createdAt,
  }) {
    final result = create();
    if (id != null) result.id = id;
    if (email != null) result.email = email;
    if (phone != null) result.phone = phone;
    if (emailConfirmed != null) result.emailConfirmed = emailConfirmed;
    if (phoneConfirmed != null) result.phoneConfirmed = phoneConfirmed;
    if (appMetadata != null) result.appMetadata = appMetadata;
    if (userMetadata != null) result.userMetadata = userMetadata;
    if (createdAt != null) result.createdAt = createdAt;
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
    ..aOS(2, _omitFieldNames ? '' : 'email')
    ..aOS(3, _omitFieldNames ? '' : 'phone')
    ..aOB(4, _omitFieldNames ? '' : 'emailConfirmed')
    ..aOB(5, _omitFieldNames ? '' : 'phoneConfirmed')
    ..aOM<$0.Json>(6, _omitFieldNames ? '' : 'appMetadata',
        subBuilder: $0.Json.create)
    ..aOM<$0.Json>(7, _omitFieldNames ? '' : 'userMetadata',
        subBuilder: $0.Json.create)
    ..aInt64(8, _omitFieldNames ? '' : 'createdAt')
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

  @$pb.TagNumber(4)
  $core.bool get emailConfirmed => $_getBF(3);
  @$pb.TagNumber(4)
  set emailConfirmed($core.bool value) => $_setBool(3, value);
  @$pb.TagNumber(4)
  $core.bool hasEmailConfirmed() => $_has(3);
  @$pb.TagNumber(4)
  void clearEmailConfirmed() => $_clearField(4);

  @$pb.TagNumber(5)
  $core.bool get phoneConfirmed => $_getBF(4);
  @$pb.TagNumber(5)
  set phoneConfirmed($core.bool value) => $_setBool(4, value);
  @$pb.TagNumber(5)
  $core.bool hasPhoneConfirmed() => $_has(4);
  @$pb.TagNumber(5)
  void clearPhoneConfirmed() => $_clearField(5);

  @$pb.TagNumber(6)
  $0.Json get appMetadata => $_getN(5);
  @$pb.TagNumber(6)
  set appMetadata($0.Json value) => $_setField(6, value);
  @$pb.TagNumber(6)
  $core.bool hasAppMetadata() => $_has(5);
  @$pb.TagNumber(6)
  void clearAppMetadata() => $_clearField(6);
  @$pb.TagNumber(6)
  $0.Json ensureAppMetadata() => $_ensure(5);

  @$pb.TagNumber(7)
  $0.Json get userMetadata => $_getN(6);
  @$pb.TagNumber(7)
  set userMetadata($0.Json value) => $_setField(7, value);
  @$pb.TagNumber(7)
  $core.bool hasUserMetadata() => $_has(6);
  @$pb.TagNumber(7)
  void clearUserMetadata() => $_clearField(7);
  @$pb.TagNumber(7)
  $0.Json ensureUserMetadata() => $_ensure(6);

  @$pb.TagNumber(8)
  $fixnum.Int64 get createdAt => $_getI64(7);
  @$pb.TagNumber(8)
  set createdAt($fixnum.Int64 value) => $_setInt64(7, value);
  @$pb.TagNumber(8)
  $core.bool hasCreatedAt() => $_has(7);
  @$pb.TagNumber(8)
  void clearCreatedAt() => $_clearField(8);
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

class UpdateAccountRequest extends $pb.GeneratedMessage {
  factory UpdateAccountRequest({
    $core.String? userId,
    $core.String? email,
    $core.String? phone,
    $0.Json? userMetadata,
  }) {
    final result = create();
    if (userId != null) result.userId = userId;
    if (email != null) result.email = email;
    if (phone != null) result.phone = phone;
    if (userMetadata != null) result.userMetadata = userMetadata;
    return result;
  }

  UpdateAccountRequest._();

  factory UpdateAccountRequest.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory UpdateAccountRequest.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'UpdateAccountRequest',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.auth.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'userId')
    ..aOS(2, _omitFieldNames ? '' : 'email')
    ..aOS(3, _omitFieldNames ? '' : 'phone')
    ..aOM<$0.Json>(4, _omitFieldNames ? '' : 'userMetadata',
        subBuilder: $0.Json.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  UpdateAccountRequest clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  UpdateAccountRequest copyWith(void Function(UpdateAccountRequest) updates) =>
      super.copyWith((message) => updates(message as UpdateAccountRequest))
          as UpdateAccountRequest;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static UpdateAccountRequest create() => UpdateAccountRequest._();
  @$core.override
  UpdateAccountRequest createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static UpdateAccountRequest getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<UpdateAccountRequest>(create);
  static UpdateAccountRequest? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get userId => $_getSZ(0);
  @$pb.TagNumber(1)
  set userId($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasUserId() => $_has(0);
  @$pb.TagNumber(1)
  void clearUserId() => $_clearField(1);

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

  @$pb.TagNumber(4)
  $0.Json get userMetadata => $_getN(3);
  @$pb.TagNumber(4)
  set userMetadata($0.Json value) => $_setField(4, value);
  @$pb.TagNumber(4)
  $core.bool hasUserMetadata() => $_has(3);
  @$pb.TagNumber(4)
  void clearUserMetadata() => $_clearField(4);
  @$pb.TagNumber(4)
  $0.Json ensureUserMetadata() => $_ensure(3);
}

class DeleteAccountRequest extends $pb.GeneratedMessage {
  factory DeleteAccountRequest({
    $core.String? userId,
    $core.bool? soft,
  }) {
    final result = create();
    if (userId != null) result.userId = userId;
    if (soft != null) result.soft = soft;
    return result;
  }

  DeleteAccountRequest._();

  factory DeleteAccountRequest.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory DeleteAccountRequest.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'DeleteAccountRequest',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.auth.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'userId')
    ..aOB(2, _omitFieldNames ? '' : 'soft')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  DeleteAccountRequest clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  DeleteAccountRequest copyWith(void Function(DeleteAccountRequest) updates) =>
      super.copyWith((message) => updates(message as DeleteAccountRequest))
          as DeleteAccountRequest;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static DeleteAccountRequest create() => DeleteAccountRequest._();
  @$core.override
  DeleteAccountRequest createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static DeleteAccountRequest getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<DeleteAccountRequest>(create);
  static DeleteAccountRequest? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get userId => $_getSZ(0);
  @$pb.TagNumber(1)
  set userId($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasUserId() => $_has(0);
  @$pb.TagNumber(1)
  void clearUserId() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.bool get soft => $_getBF(1);
  @$pb.TagNumber(2)
  set soft($core.bool value) => $_setBool(1, value);
  @$pb.TagNumber(2)
  $core.bool hasSoft() => $_has(1);
  @$pb.TagNumber(2)
  void clearSoft() => $_clearField(2);
}

class DeleteAccountResult extends $pb.GeneratedMessage {
  factory DeleteAccountResult({
    $0.Failure? error,
  }) {
    final result = create();
    if (error != null) result.error = error;
    return result;
  }

  DeleteAccountResult._();

  factory DeleteAccountResult.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory DeleteAccountResult.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'DeleteAccountResult',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.auth.v1'),
      createEmptyInstance: create)
    ..aOM<$0.Failure>(1, _omitFieldNames ? '' : 'error',
        subBuilder: $0.Failure.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  DeleteAccountResult clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  DeleteAccountResult copyWith(void Function(DeleteAccountResult) updates) =>
      super.copyWith((message) => updates(message as DeleteAccountResult))
          as DeleteAccountResult;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static DeleteAccountResult create() => DeleteAccountResult._();
  @$core.override
  DeleteAccountResult createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static DeleteAccountResult getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<DeleteAccountResult>(create);
  static DeleteAccountResult? _defaultInstance;

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

class SessionRequest extends $pb.GeneratedMessage {
  factory SessionRequest({
    $core.String? sessionId,
    $core.String? userId,
  }) {
    final result = create();
    if (sessionId != null) result.sessionId = sessionId;
    if (userId != null) result.userId = userId;
    return result;
  }

  SessionRequest._();

  factory SessionRequest.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory SessionRequest.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'SessionRequest',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.auth.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'sessionId')
    ..aOS(2, _omitFieldNames ? '' : 'userId')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  SessionRequest clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  SessionRequest copyWith(void Function(SessionRequest) updates) =>
      super.copyWith((message) => updates(message as SessionRequest))
          as SessionRequest;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static SessionRequest create() => SessionRequest._();
  @$core.override
  SessionRequest createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static SessionRequest getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<SessionRequest>(create);
  static SessionRequest? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get sessionId => $_getSZ(0);
  @$pb.TagNumber(1)
  set sessionId($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasSessionId() => $_has(0);
  @$pb.TagNumber(1)
  void clearSessionId() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.String get userId => $_getSZ(1);
  @$pb.TagNumber(2)
  set userId($core.String value) => $_setString(1, value);
  @$pb.TagNumber(2)
  $core.bool hasUserId() => $_has(1);
  @$pb.TagNumber(2)
  void clearUserId() => $_clearField(2);
}

class SessionSummary extends $pb.GeneratedMessage {
  factory SessionSummary({
    $core.String? id,
    $core.String? userId,
    $fixnum.Int64? createdAt,
    $fixnum.Int64? expiresAt,
  }) {
    final result = create();
    if (id != null) result.id = id;
    if (userId != null) result.userId = userId;
    if (createdAt != null) result.createdAt = createdAt;
    if (expiresAt != null) result.expiresAt = expiresAt;
    return result;
  }

  SessionSummary._();

  factory SessionSummary.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory SessionSummary.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'SessionSummary',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.auth.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'id')
    ..aOS(2, _omitFieldNames ? '' : 'userId')
    ..aInt64(3, _omitFieldNames ? '' : 'createdAt')
    ..aInt64(4, _omitFieldNames ? '' : 'expiresAt')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  SessionSummary clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  SessionSummary copyWith(void Function(SessionSummary) updates) =>
      super.copyWith((message) => updates(message as SessionSummary))
          as SessionSummary;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static SessionSummary create() => SessionSummary._();
  @$core.override
  SessionSummary createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static SessionSummary getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<SessionSummary>(create);
  static SessionSummary? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get id => $_getSZ(0);
  @$pb.TagNumber(1)
  set id($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasId() => $_has(0);
  @$pb.TagNumber(1)
  void clearId() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.String get userId => $_getSZ(1);
  @$pb.TagNumber(2)
  set userId($core.String value) => $_setString(1, value);
  @$pb.TagNumber(2)
  $core.bool hasUserId() => $_has(1);
  @$pb.TagNumber(2)
  void clearUserId() => $_clearField(2);

  @$pb.TagNumber(3)
  $fixnum.Int64 get createdAt => $_getI64(2);
  @$pb.TagNumber(3)
  set createdAt($fixnum.Int64 value) => $_setInt64(2, value);
  @$pb.TagNumber(3)
  $core.bool hasCreatedAt() => $_has(2);
  @$pb.TagNumber(3)
  void clearCreatedAt() => $_clearField(3);

  @$pb.TagNumber(4)
  $fixnum.Int64 get expiresAt => $_getI64(3);
  @$pb.TagNumber(4)
  set expiresAt($fixnum.Int64 value) => $_setInt64(3, value);
  @$pb.TagNumber(4)
  $core.bool hasExpiresAt() => $_has(3);
  @$pb.TagNumber(4)
  void clearExpiresAt() => $_clearField(4);
}

class SessionListResult extends $pb.GeneratedMessage {
  factory SessionListResult({
    $core.Iterable<SessionSummary>? sessions,
    $0.Failure? error,
  }) {
    final result = create();
    if (sessions != null) result.sessions.addAll(sessions);
    if (error != null) result.error = error;
    return result;
  }

  SessionListResult._();

  factory SessionListResult.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory SessionListResult.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'SessionListResult',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.auth.v1'),
      createEmptyInstance: create)
    ..pPM<SessionSummary>(1, _omitFieldNames ? '' : 'sessions',
        subBuilder: SessionSummary.create)
    ..aOM<$0.Failure>(2, _omitFieldNames ? '' : 'error',
        subBuilder: $0.Failure.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  SessionListResult clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  SessionListResult copyWith(void Function(SessionListResult) updates) =>
      super.copyWith((message) => updates(message as SessionListResult))
          as SessionListResult;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static SessionListResult create() => SessionListResult._();
  @$core.override
  SessionListResult createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static SessionListResult getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<SessionListResult>(create);
  static SessionListResult? _defaultInstance;

  @$pb.TagNumber(1)
  $pb.PbList<SessionSummary> get sessions => $_getList(0);

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

class SignOutRequest extends $pb.GeneratedMessage {
  factory SignOutRequest({
    $core.String? userId,
    $core.String? sessionId,
    $core.bool? global,
  }) {
    final result = create();
    if (userId != null) result.userId = userId;
    if (sessionId != null) result.sessionId = sessionId;
    if (global != null) result.global = global;
    return result;
  }

  SignOutRequest._();

  factory SignOutRequest.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory SignOutRequest.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'SignOutRequest',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.auth.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'userId')
    ..aOS(2, _omitFieldNames ? '' : 'sessionId')
    ..aOB(3, _omitFieldNames ? '' : 'global')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  SignOutRequest clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  SignOutRequest copyWith(void Function(SignOutRequest) updates) =>
      super.copyWith((message) => updates(message as SignOutRequest))
          as SignOutRequest;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static SignOutRequest create() => SignOutRequest._();
  @$core.override
  SignOutRequest createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static SignOutRequest getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<SignOutRequest>(create);
  static SignOutRequest? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get userId => $_getSZ(0);
  @$pb.TagNumber(1)
  set userId($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasUserId() => $_has(0);
  @$pb.TagNumber(1)
  void clearUserId() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.String get sessionId => $_getSZ(1);
  @$pb.TagNumber(2)
  set sessionId($core.String value) => $_setString(1, value);
  @$pb.TagNumber(2)
  $core.bool hasSessionId() => $_has(1);
  @$pb.TagNumber(2)
  void clearSessionId() => $_clearField(2);

  @$pb.TagNumber(3)
  $core.bool get global => $_getBF(2);
  @$pb.TagNumber(3)
  set global($core.bool value) => $_setBool(2, value);
  @$pb.TagNumber(3)
  $core.bool hasGlobal() => $_has(2);
  @$pb.TagNumber(3)
  void clearGlobal() => $_clearField(3);
}

class SignOutResult extends $pb.GeneratedMessage {
  factory SignOutResult({
    $0.Failure? error,
  }) {
    final result = create();
    if (error != null) result.error = error;
    return result;
  }

  SignOutResult._();

  factory SignOutResult.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory SignOutResult.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'SignOutResult',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.auth.v1'),
      createEmptyInstance: create)
    ..aOM<$0.Failure>(1, _omitFieldNames ? '' : 'error',
        subBuilder: $0.Failure.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  SignOutResult clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  SignOutResult copyWith(void Function(SignOutResult) updates) =>
      super.copyWith((message) => updates(message as SignOutResult))
          as SignOutResult;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static SignOutResult create() => SignOutResult._();
  @$core.override
  SignOutResult createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static SignOutResult getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<SignOutResult>(create);
  static SignOutResult? _defaultInstance;

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

class AuthApi {
  final $pb.RpcClient _client;

  AuthApi(this._client);

  $async.Future<AccountResult> getAccount(
          $pb.ClientContext? ctx, AccountRequest request) =>
      _client.invoke<AccountResult>(
          ctx, 'Auth', 'GetAccount', request, AccountResult());
  $async.Future<AccountResult> updateAccount(
          $pb.ClientContext? ctx, UpdateAccountRequest request) =>
      _client.invoke<AccountResult>(
          ctx, 'Auth', 'UpdateAccount', request, AccountResult());
  $async.Future<DeleteAccountResult> deleteAccount(
          $pb.ClientContext? ctx, DeleteAccountRequest request) =>
      _client.invoke<DeleteAccountResult>(
          ctx, 'Auth', 'DeleteAccount', request, DeleteAccountResult());
  $async.Future<SessionListResult> listSessions(
          $pb.ClientContext? ctx, SessionRequest request) =>
      _client.invoke<SessionListResult>(
          ctx, 'Auth', 'ListSessions', request, SessionListResult());
  $async.Future<SignOutResult> signOut(
          $pb.ClientContext? ctx, SignOutRequest request) =>
      _client.invoke<SignOutResult>(
          ctx, 'Auth', 'SignOut', request, SignOutResult());
  $async.Future<ValidateResult> validate(
          $pb.ClientContext? ctx, ValidateRequest request) =>
      _client.invoke<ValidateResult>(
          ctx, 'Auth', 'Validate', request, ValidateResult());
}

const $core.bool _omitFieldNames =
    $core.bool.fromEnvironment('protobuf.omit_field_names');
const $core.bool _omitMessageNames =
    $core.bool.fromEnvironment('protobuf.omit_message_names');
