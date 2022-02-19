package com.weisong.backend.entities;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.Column;
import javax.persistence.Table;
import javax.validation.constraints.*;
import java.util.Date;

/**
 * @author 李伟松
 * @create 2022-02-16-19:36
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name ="employee")
public class Employee {

    @Column(name="emp_id")
    private Integer emp_id;

    @NotEmpty(message = "名字不能为空")
    @Column(name="lastName")
    private String lastName;

    @Email(message = "邮箱格式不正确")
    @Column(name="email")
    private String email;

    @Column(name="gender")
    private Integer gender;

    @Column(name="departmentName")
    private String departmentName;

    @Column(name="birth")
    private Date birth;
}
